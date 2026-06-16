import { PrismaClient } from '@prisma/client';
import { AdminSettings } from '../types';
import { DEFAULT_ADMIN_SETTINGS, UNLIMITED_VOLUME } from '../config/defaults';
import { ALL_DEFAULT_PROBLEM_TYPES } from '../config/problemTypeCatalog';
import { getDefaultCoverageMultipliers } from '../config/solutionFeatureCatalog';

const prisma = new PrismaClient();

let cachedSettings: AdminSettings | null = null;

/** Infinity and null maxVolume break JSON + Zod validation on save. */
export function normalizeAdminSettings(settings: AdminSettings): AdminSettings {
  return {
    ...settings,
    volumeTiers: settings.volumeTiers.map((tier) => ({
      ...tier,
      maxVolume:
        tier.maxVolume == null ||
        tier.maxVolume === Infinity ||
        !Number.isFinite(tier.maxVolume) ||
        tier.requiresCustomPricing
          ? UNLIMITED_VOLUME
          : tier.maxVolume,
    })),
  };
}

function mergeProblemTypes(existing: AdminSettings): AdminSettings {
  const catalogMap = new Map(ALL_DEFAULT_PROBLEM_TYPES.map((p) => [p.type, p]));
  const existingTypes = new Set(existing.problemTypes.map((p) => p.type));

  const problemTypes = existing.problemTypes.map((p) => {
    const catalog = catalogMap.get(p.type);
    if (!catalog) return p;
    return {
      ...p,
      category: p.category ?? catalog.category,
      description: p.description || catalog.description,
    };
  });

  const newTypes = ALL_DEFAULT_PROBLEM_TYPES.filter((p) => !existingTypes.has(p.type));
  if (newTypes.length === 0 && problemTypes.every((p, i) => p === existing.problemTypes[i])) {
    return existing;
  }

  return { ...existing, problemTypes: [...problemTypes, ...newTypes] };
}

function mergeCoverageMultipliers(existing: AdminSettings): AdminSettings {
  const defaults = getDefaultCoverageMultipliers();
  const merged = { ...defaults, ...existing.coverageMultipliers };
  const changed = JSON.stringify(merged) !== JSON.stringify(existing.coverageMultipliers);
  if (!changed) return existing;
  return { ...existing, coverageMultipliers: merged };
}

function mergeSettings(existing: AdminSettings): AdminSettings {
  let settings = mergeProblemTypes(existing);
  settings = mergeCoverageMultipliers(settings);

  if (!settings.setupFeeConfig) {
    settings = {
      ...settings,
      setupFeeConfig: { ...DEFAULT_ADMIN_SETTINGS.setupFeeConfig },
    };
  } else {
    settings = {
      ...settings,
      setupFeeConfig: {
        ...DEFAULT_ADMIN_SETTINGS.setupFeeConfig,
        ...settings.setupFeeConfig,
        integrationMultipliers: {
          ...DEFAULT_ADMIN_SETTINGS.setupFeeConfig.integrationMultipliers,
          ...settings.setupFeeConfig.integrationMultipliers,
        },
        complianceMultipliers: {
          ...DEFAULT_ADMIN_SETTINGS.setupFeeConfig.complianceMultipliers,
          ...settings.setupFeeConfig.complianceMultipliers,
        },
      },
    };
  }

  return normalizeAdminSettings(settings);
}

export async function loadAdminSettings(): Promise<AdminSettings> {
  if (cachedSettings) return cachedSettings;

  const record = await prisma.appSettings.findUnique({ where: { id: 'default' } });
  if (record) {
    let settings = normalizeAdminSettings(JSON.parse(record.data) as AdminSettings);
    const merged = normalizeAdminSettings(mergeSettings(settings));
    const changed = JSON.stringify(merged) !== JSON.stringify(settings);
    if (changed) {
      await prisma.appSettings.update({
        where: { id: 'default' },
        data: { data: JSON.stringify(merged) },
      });
      settings = merged;
    }
    cachedSettings = settings;
    return cachedSettings;
  }

  await prisma.appSettings.create({
    data: { id: 'default', data: JSON.stringify(DEFAULT_ADMIN_SETTINGS) },
  });
  cachedSettings = { ...DEFAULT_ADMIN_SETTINGS };
  return cachedSettings;
}

export function getAdminSettings(): AdminSettings {
  if (!cachedSettings) {
    return DEFAULT_ADMIN_SETTINGS;
  }
  return cachedSettings;
}

export async function saveAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
  const normalized = normalizeAdminSettings(settings);
  const data = JSON.stringify(normalized);
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default', data },
    update: { data },
  });
  cachedSettings = normalized;
  return normalized;
}

export async function initAdminConfig(): Promise<void> {
  await loadAdminSettings();
}

export function invalidateCache(): void {
  cachedSettings = null;
}

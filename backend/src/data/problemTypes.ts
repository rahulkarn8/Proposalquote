import { Complexity, ProblemType, ProblemTypeFactors } from '../types';
import { getAdminSettings } from '../services/adminConfig';

export function getProblemTypeFactors(type: ProblemType): ProblemTypeFactors {
  const settings = getAdminSettings();
  const factors = settings.problemTypes.find((p) => p.type === type);
  if (!factors) {
    throw new Error(`Unknown problem type: ${type}`);
  }
  return factors;
}

export function getAllProblemTypes(): ProblemTypeFactors[] {
  return getAdminSettings().problemTypes;
}

export function getHourlyRate(complexity: Complexity): number {
  return getAdminSettings().hourlyRates[complexity];
}

export function getCoverageMultiplier(coverage: string[]): number {
  const { coverageMultipliers, setupFeeConfig } = getAdminSettings();
  let multiplier = 1.0;
  for (const item of coverage) {
    multiplier += coverageMultipliers[item] ?? setupFeeConfig.defaultCoverageMultiplier;
  }
  return multiplier;
}

export function getIntegrationMultiplier(complexity: 'LOW' | 'MEDIUM' | 'HIGH'): number {
  return getAdminSettings().setupFeeConfig.integrationMultipliers[complexity];
}

export function getComplianceMultiplier(requirements: string[]): number {
  const multipliers = getAdminSettings().setupFeeConfig.complianceMultipliers;
  let multiplier = 1.0;
  for (const req of requirements) {
    if (req !== 'NONE') {
      multiplier += multipliers[req] ?? 0;
    }
  }
  return multiplier;
}

export function getSetupGlobalMultiplier(): number {
  return getAdminSettings().setupFeeConfig.globalMultiplier;
}

export function getMaintenanceFeePercent(): number {
  return getAdminSettings().setupFeeConfig.maintenanceFeePercent;
}

export function getSupportPercentOfSetup(): number {
  return getAdminSettings().setupFeeConfig.supportPercentOfSetup;
}

export function getPerTicketSupportBase(): number {
  return getAdminSettings().setupFeeConfig.perTicketSupportBase;
}

export function getSupportMultiplier(sla: string, hours: string): number {
  const { slaMultipliers, hoursMultipliers } = getAdminSettings().supportTierPricing;
  return (slaMultipliers[sla] ?? 1.0) * (hoursMultipliers[hours] ?? 1.0);
}

export function getBaseSupportMonthly(): number {
  return getAdminSettings().supportTierPricing.baseSupportMonthly;
}

export function getCloudMarkup(): number {
  return getAdminSettings().cloudMarkup;
}

export function getTaxRate(): number {
  return getAdminSettings().taxRate;
}

export function getDefaultCurrency() {
  return getAdminSettings().defaultCurrency;
}

export function getVolumeTier(volume: number): { discount: number; label: string; requiresCustomPricing: boolean } {
  const tiers = getAdminSettings().volumeTiers;
  for (const tier of tiers) {
    if (volume <= tier.maxVolume) {
      return {
        discount: tier.discount,
        label: tier.label,
        requiresCustomPricing: tier.requiresCustomPricing ?? false,
      };
    }
  }
  const last = tiers[tiers.length - 1];
  return {
    discount: last.discount,
    label: last.label,
    requiresCustomPricing: last.requiresCustomPricing ?? true,
  };
}

export function addProblemType(factors: ProblemTypeFactors): void {
  const settings = getAdminSettings();
  if (settings.problemTypes.some((p) => p.type === factors.type)) {
    throw new Error(`Problem type ${factors.type} already exists`);
  }
  settings.problemTypes.push(factors);
}

export function updateProblemType(type: string, factors: Partial<ProblemTypeFactors>): void {
  const settings = getAdminSettings();
  const index = settings.problemTypes.findIndex((p) => p.type === type);
  if (index === -1) throw new Error(`Problem type ${type} not found`);
  settings.problemTypes[index] = { ...settings.problemTypes[index], ...factors, type };
}

export function removeProblemType(type: string): void {
  const settings = getAdminSettings();
  settings.problemTypes = settings.problemTypes.filter((p) => p.type !== type);
}

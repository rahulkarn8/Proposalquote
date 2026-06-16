import type { HardwareBomLine } from '@/types';

export function createEmptyBomLine(): HardwareBomLine {
  return { item: '', partNumber: '', quantity: 1, unitPrice: 0 };
}

export function sumHardwareBom(bom: HardwareBomLine[]): number {
  return bom.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function formatBomLineLabel(line: HardwareBomLine): string {
  return line.partNumber?.trim()
    ? `${line.item} (${line.partNumber.trim()})`
    : line.item;
}

/** Migrate legacy single-field hardware configs when loading saved quotes. */
export function migrateLegacyHardwareBom(
  config: Partial<{
    includesHardware?: boolean;
    hardwareBom?: HardwareBomLine[];
    hardwareDescription?: string;
    hardwareCost?: number;
  }>
): HardwareBomLine[] {
  if (config.hardwareBom?.length) return config.hardwareBom;
  if (config.includesHardware && (config.hardwareCost ?? 0) > 0) {
    return [{
      item: config.hardwareDescription?.trim() || 'Hardware',
      partNumber: '',
      quantity: 1,
      unitPrice: config.hardwareCost ?? 0,
    }];
  }
  return [];
}

import type { HardwareBomLine } from '../types';

export function sumHardwareBom(bom: HardwareBomLine[]): number {
  return bom.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function formatBomLineLabel(line: HardwareBomLine): string {
  return line.partNumber?.trim()
    ? `${line.item} (${line.partNumber.trim()})`
    : line.item;
}

export function getEffectiveHardwareBom(
  includesHardware: boolean,
  hardwareBom: HardwareBomLine[] | undefined,
  legacy?: { hardwareDescription?: string; hardwareCost?: number }
): HardwareBomLine[] {
  if (!includesHardware) return [];
  if (hardwareBom?.length) return hardwareBom;
  if (legacy?.hardwareCost && legacy.hardwareCost > 0) {
    return [{
      item: legacy.hardwareDescription?.trim() || 'Hardware',
      partNumber: '',
      quantity: 1,
      unitPrice: legacy.hardwareCost,
    }];
  }
  return [];
}

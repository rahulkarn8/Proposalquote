import type { EngineeringEffortCatalogItem, EngineeringEffortLine } from '@/types';

export function sumEngineeringBreakdown(breakdown: { hours: number }[]): number {
  return breakdown.reduce((sum, line) => sum + line.hours, 0);
}

export function buildDefaultEngineeringBreakdown(
  efforts: EngineeringEffortCatalogItem[],
  typicalHours: number,
): EngineeringEffortLine[] {
  return efforts.map((effort) => ({
    item: effort.label,
    hours: Math.max(1, Math.round(typicalHours * effort.defaultShare)),
  }));
}

export function rescaleEngineeringBreakdown(
  breakdown: EngineeringEffortLine[],
  targetTotal: number,
): EngineeringEffortLine[] {
  const currentTotal = sumEngineeringBreakdown(breakdown);
  if (currentTotal <= 0 || targetTotal <= 0) {
    return breakdown.map((line) => ({ ...line, hours: 0 }));
  }

  const scaled = breakdown.map((line) => ({
    item: line.item,
    hours: Math.max(0, Math.round((line.hours / currentTotal) * targetTotal)),
  }));

  let diff = targetTotal - sumEngineeringBreakdown(scaled);
  let index = 0;
  while (diff !== 0 && scaled.length > 0) {
    const line = scaled[index % scaled.length];
    if (diff > 0) {
      line.hours += 1;
      diff -= 1;
    } else if (line.hours > 0) {
      line.hours -= 1;
      diff += 1;
    }
    index += 1;
    if (index > scaled.length * 2000) break;
  }

  return scaled;
}

export function groupEngineeringBreakdown(
  breakdown: EngineeringEffortLine[],
  efforts: EngineeringEffortCatalogItem[],
  categories: string[],
): { category: string; lines: EngineeringEffortLine[] }[] {
  const lookup = new Map(efforts.map((effort) => [effort.label, effort.category]));
  const groups = new Map<string, EngineeringEffortLine[]>();

  for (const line of breakdown) {
    if (line.hours <= 0) continue;
    const category = lookup.get(line.item) ?? 'Other Engineering';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(line);
  }

  const order = categories.length > 0 ? categories : [...groups.keys()];
  const result: { category: string; lines: EngineeringEffortLine[] }[] = [];
  for (const category of order) {
    const lines = groups.get(category);
    if (lines?.length) result.push({ category, lines });
  }
  for (const [category, lines] of groups) {
    if (!order.includes(category)) result.push({ category, lines });
  }
  return result;
}

export function mergeEngineeringBreakdown(
  efforts: EngineeringEffortCatalogItem[],
  existing: EngineeringEffortLine[] | undefined,
  typicalHours: number,
): EngineeringEffortLine[] {
  const byItem = new Map((existing ?? []).map((line) => [line.item, line.hours]));
  return buildDefaultEngineeringBreakdown(efforts, typicalHours).map((line) => ({
    item: line.item,
    hours: byItem.get(line.item) ?? line.hours,
  }));
}

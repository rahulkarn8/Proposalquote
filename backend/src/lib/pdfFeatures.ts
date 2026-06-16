import { PricingLineItem } from '../types';
import {
  ALL_SOLUTION_FEATURES,
  getCategoryOrder,
} from '../config/solutionFeatureCatalog';
import {
  ALL_ENGINEERING_EFFORTS,
  getEngineeringCategoryOrder,
  groupEngineeringBreakdown,
} from '../config/engineeringEffortCatalog';

export interface FeatureGroup {
  category: string;
  features: string[];
}

export interface EngineeringEffortGroup {
  category: string;
  lines: { item: string; hours: number }[];
}

export interface PdfPricingRow {
  label: string;
  sublabel?: string;
  type: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

const featureCategoryLookup = new Map(
  ALL_SOLUTION_FEATURES.map((f) => [f.label, f.category]),
);

const engineeringCategoryLookup = new Map(
  ALL_ENGINEERING_EFFORTS.map((e) => [e.label, e.category]),
);

export function groupSelectedFeatures(coverage: string[]): FeatureGroup[] {
  const groups = new Map<string, string[]>();
  for (const label of coverage) {
    const category = featureCategoryLookup.get(label) ?? 'Custom / Other';
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(label);
  }

  const order = getCategoryOrder();
  const result: FeatureGroup[] = [];
  for (const category of order) {
    const features = groups.get(category);
    if (features?.length) result.push({ category, features });
  }
  for (const [category, features] of groups) {
    if (!order.includes(category)) result.push({ category, features });
  }
  return result;
}

export function groupEngineeringEffortsForPdf(
  breakdown: { item: string; hours: number }[],
): EngineeringEffortGroup[] {
  return groupEngineeringBreakdown(breakdown);
}

function extractFeatureLabel(description: string): string {
  const idx = description.indexOf(' (');
  return idx >= 0 ? description.slice(0, idx) : description;
}

function extractEngineeringHours(description: string): number | null {
  const match = description.match(/\((\d+)h\)$/);
  return match ? Number(match[1]) : null;
}

/** Collapse setup line items into category subtotals for PDF tables. */
export function buildPdfPricingRows(
  lineItems: PricingLineItem[],
  sym: string,
  setupPricingMode: 'ENGINEERING_EFFORT' | 'FEATURE_WISE' = 'FEATURE_WISE',
): PdfPricingRow[] {
  const setupItems = lineItems.filter((item) => item.category === 'Setup & Engineering');
  const otherItems = lineItems.filter((item) => item.category !== 'Setup & Engineering');

  const rows: PdfPricingRow[] = [];

  if (setupItems.length <= 1) {
    for (const item of setupItems) {
      rows.push({
        label: item.description,
        sublabel: item.category,
        type: item.recurring ? 'Monthly' : 'One-time',
        quantity: String(item.quantity),
        unitPrice: `${sym}${item.unitPrice.toLocaleString()}`,
        total: `${sym}${item.total.toLocaleString()}`,
      });
    }
  } else {
    const byCategory = new Map<string, { labels: string[]; total: number; hours: number }>();
    for (const item of setupItems) {
      const feature = extractFeatureLabel(item.description);
      const engineeringHours = extractEngineeringHours(item.description);
      const category = setupPricingMode === 'ENGINEERING_EFFORT'
        ? (engineeringCategoryLookup.get(feature) ?? 'Setup & Engineering')
        : (featureCategoryLookup.get(feature) ?? 'Setup & Engineering');
      if (!byCategory.has(category)) byCategory.set(category, { labels: [], total: 0, hours: 0 });
      const group = byCategory.get(category)!;
      group.labels.push(feature);
      group.total += item.total;
      group.hours += engineeringHours ?? item.quantity;
    }

    const categoryOrder = setupPricingMode === 'ENGINEERING_EFFORT'
      ? getEngineeringCategoryOrder()
      : getCategoryOrder();

    for (const category of categoryOrder) {
      const group = byCategory.get(category);
      if (!group) continue;
      const sublabel = setupPricingMode === 'ENGINEERING_EFFORT'
        ? `${group.hours}h across ${group.labels.length} effort${group.labels.length > 1 ? 's' : ''}`
        : `${group.labels.length} feature${group.labels.length > 1 ? 's' : ''}`;
      rows.push({
        label: `Setup — ${category}`,
        sublabel,
        type: 'One-time',
        quantity: String(setupPricingMode === 'ENGINEERING_EFFORT' ? group.hours : group.labels.length),
        unitPrice: '—',
        total: `${sym}${group.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      });
      byCategory.delete(category);
    }
    for (const [category, group] of byCategory) {
      const sublabel = setupPricingMode === 'ENGINEERING_EFFORT'
        ? `${group.hours}h across ${group.labels.length} effort${group.labels.length > 1 ? 's' : ''}`
        : `${group.labels.length} feature${group.labels.length > 1 ? 's' : ''}`;
      rows.push({
        label: `Setup — ${category}`,
        sublabel,
        type: 'One-time',
        quantity: String(setupPricingMode === 'ENGINEERING_EFFORT' ? group.hours : group.labels.length),
        unitPrice: '—',
        total: `${sym}${group.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      });
    }
  }

  for (const item of otherItems) {
    rows.push({
      label: item.description || item.category,
      sublabel: item.description ? item.category : undefined,
      type: item.recurring ? 'Monthly' : 'One-time',
      quantity: String(item.quantity),
      unitPrice: `${sym}${item.unitPrice.toLocaleString()}`,
      total: `${sym}${item.total.toLocaleString()}`,
    });
  }

  return rows;
}

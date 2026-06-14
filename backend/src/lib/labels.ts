import type {
  CoverageType,
  SupportCostModel,
  SupportHours,
  SupportSLA,
  WarrantyUnit,
} from '../types';

export const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
  DEFECTS_ONLY: 'Defects Only',
  PERFORMANCE_GUARANTEE: 'Performance Guarantee',
  FULL_MAINTENANCE: 'Full Maintenance',
};

export const SUPPORT_HOURS_LABELS: Record<SupportHours, string> = {
  BUSINESS_HOURS: 'Business Hours (Mon–Fri)',
  '24x7': '24×7 Coverage',
  CUSTOM: 'Custom Schedule',
};

export const SUPPORT_SLA_LABELS: Record<SupportSLA, string> = {
  '4HR': '4-Hour Response',
  '8HR': '8-Hour Response',
  '24HR': '24-Hour Response',
  NEXT_BUSINESS_DAY: 'Next Business Day',
};

export const SUPPORT_COST_MODEL_LABELS: Record<SupportCostModel, string> = {
  FIXED_MONTHLY: 'Fixed Monthly Fee',
  PERCENTAGE_OF_SUBSCRIPTION: 'Percentage of Subscription',
  PER_TICKET: 'Per Support Ticket',
};

export function formatWarrantyClause(
  warrantyPeriod: number,
  warrantyUnit: WarrantyUnit,
  coverageType: CoverageType
): string {
  if (!warrantyPeriod || warrantyPeriod <= 0) {
    return 'No warranty period';
  }
  return `${warrantyPeriod} ${warrantyUnit} — ${COVERAGE_TYPE_LABELS[coverageType]}`;
}

export function formatSupportClause(
  supportHours: SupportHours,
  supportSLA: SupportSLA,
  supportCostModel: SupportCostModel
): string {
  return (
    `${SUPPORT_HOURS_LABELS[supportHours]} with ${SUPPORT_SLA_LABELS[supportSLA]}. ` +
    `Billing: ${SUPPORT_COST_MODEL_LABELS[supportCostModel]}.`
  );
}

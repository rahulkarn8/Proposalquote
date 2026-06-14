import type { QuoteFormValues } from '@/lib/schema';
import {
  COVERAGE_TYPE_LABELS,
  SUPPORT_COST_MODEL_LABELS,
  SUPPORT_HOURS_LABELS,
  SUPPORT_SLA_LABELS,
  formatSupportClause,
  formatWarrantyClause,
  warrantyMonths,
} from '@/lib/labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SupportClauseSummaryProps {
  values: Pick<
    QuoteFormValues,
    | 'warrantyPeriod'
    | 'warrantyUnit'
    | 'coverageType'
    | 'supportHours'
    | 'supportSLA'
    | 'supportCostModel'
  >;
  title?: string;
  compact?: boolean;
}

export function SupportClauseSummary({ values, title = 'Support & Warranty Clause', compact }: SupportClauseSummaryProps) {
  const period = Number(values.warrantyPeriod);
  const months = warrantyMonths(values.warrantyPeriod, values.warrantyUnit);

  if (compact) {
    return (
      <div className="text-sm space-y-2">
        <div>
          <p className="text-[var(--color-muted-foreground)]">Warranty</p>
          <p>{formatWarrantyClause(values.warrantyPeriod, values.warrantyUnit, values.coverageType)}</p>
        </div>
        <div>
          <p className="text-[var(--color-muted-foreground)]">Support</p>
          <p>{SUPPORT_HOURS_LABELS[values.supportHours]}</p>
          <p>{SUPPORT_SLA_LABELS[values.supportSLA]}</p>
          <p>{SUPPORT_COST_MODEL_LABELS[values.supportCostModel]}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-[var(--color-muted)]/30 border-[var(--color-border)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium text-[var(--color-primary)] mb-1">Warranty</p>
          <p>{formatWarrantyClause(values.warrantyPeriod, values.warrantyUnit, values.coverageType)}</p>
          {period > 0 && (
            <p className="text-green-700 mt-2">
              Bug fixes included at no additional cost during the warranty period.
            </p>
          )}
        </div>

        <div>
          <p className="font-medium text-[var(--color-primary)] mb-1">Support</p>
          <p className="leading-relaxed">{formatSupportClause(values.supportHours, values.supportSLA, values.supportCostModel)}</p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
            <li>• Hours: {SUPPORT_HOURS_LABELS[values.supportHours]}</li>
            <li>• Response SLA: {SUPPORT_SLA_LABELS[values.supportSLA]}</li>
            <li>• Cost model: {SUPPORT_COST_MODEL_LABELS[values.supportCostModel]}</li>
            <li>• Coverage: {COVERAGE_TYPE_LABELS[values.coverageType]}</li>
          </ul>
        </div>

        {months > 12 && (
          <p className="text-amber-700 text-xs bg-amber-50 p-2 rounded-md">
            Extended warranty (&gt;12 months) adds 10% to the monthly subscription fee.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

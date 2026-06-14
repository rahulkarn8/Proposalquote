import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { formatCurrency } from '@/lib/utils';
import type { PricingBreakdown } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SelectedPaymentDisplay } from '@/components/PaymentOptionsDisplay';
import { SupportClauseSummary } from '@/components/SupportClauseSummary';
import {
  COVERAGE_TYPE_LABELS,
  SUPPORT_COST_MODEL_LABELS,
  SUPPORT_HOURS_LABELS,
  SUPPORT_SLA_LABELS,
  formatWarrantyClause,
} from '@/lib/labels';

interface StepReviewProps {
  form: UseFormReturn<QuoteFormValues>;
  pricing: PricingBreakdown | null;
  problemTypeLabel?: string;
}

export function StepReview({ form, pricing, problemTypeLabel }: StepReviewProps) {
  const values = form.getValues();
  const currency = values.currency;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review & Generate</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Review your configuration before saving or generating a PDF proposal
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Client & Problem Statement</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-[var(--color-muted-foreground)]">Client</p>
            <p className="font-medium">{values.clientName}</p>
          </div>
          <div>
            <p className="text-[var(--color-muted-foreground)]">Problem Statement</p>
            <p className="leading-relaxed">{values.problemStatement}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Problem & Scope</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Type</span><span>{problemTypeLabel ?? values.problemType}</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Complexity</span><Badge variant="outline">{values.complexity}</Badge></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Volume</span><span>{values.volume.toLocaleString()} {values.volumeUnit}</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Engineering</span><span>{values.engineeringEffort}h</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Start Date</span><span>{values.startDate}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Support & Warranty</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-[var(--color-muted-foreground)]">Warranty</p>
              <p className="font-medium">
                {formatWarrantyClause(values.warrantyPeriod, values.warrantyUnit, values.coverageType)}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Support Hours</p>
              <p>{SUPPORT_HOURS_LABELS[values.supportHours]}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Response SLA</p>
              <p>{SUPPORT_SLA_LABELS[values.supportSLA]}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Support Billing</p>
              <p>{SUPPORT_COST_MODEL_LABELS[values.supportCostModel]}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Coverage Type</p>
              <p>{COVERAGE_TYPE_LABELS[values.coverageType]}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Cloud & Contract</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Cloud</span><span>{values.cloudProvider}</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Contract</span><span>{values.expectedLifetime} months</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Integration</span><span>{values.integrationComplexity}</span></div>
            <div className="flex justify-between"><span className="text-[var(--color-muted-foreground)]">Payment Model</span><span>{values.paymentModel === 'ONE_TIME' ? 'One-Time Payment' : 'Monthly Subscription'}</span></div>
          </CardContent>
        </Card>
      </div>

      <SupportClauseSummary values={values} title="Support Clause (as it appears in the proposal)" />

      <Card>
        <CardHeader><CardTitle className="text-base">Solution Coverage</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {values.solutionCoverage.map((item) => (
              <Badge key={item} variant="secondary">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {pricing && (
        <Card className="border-[var(--color-primary)]">
          <CardHeader>
            <CardTitle className="text-base">Final Quote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SelectedPaymentDisplay option={pricing.paymentOption} currency={currency} />

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Line Item Breakdown</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Item</th>
                      <th className="text-left py-2">Type</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing.lineItems.map((item) => (
                      <tr key={item.category} className="border-b border-[var(--color-border)]">
                        <td className="py-2">{item.category}</td>
                        <td className="py-2">{item.recurring ? 'Monthly' : 'One-time'}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice, currency)}</td>
                        <td className="text-right py-2 font-medium">{formatCurrency(item.total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

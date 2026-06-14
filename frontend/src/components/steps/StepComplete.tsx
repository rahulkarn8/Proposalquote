import { formatCurrency } from '@/lib/utils';
import type { PricingBreakdown } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SelectedPaymentDisplay } from '@/components/PaymentOptionsDisplay';
import { CheckCircle2, Circle } from 'lucide-react';

interface StepCompleteProps {
  quoteNumber: string;
  clientName: string;
  pricing: PricingBreakdown | null;
  currency: string;
  pdfDownloaded?: boolean;
  emailOpened?: boolean;
}

const WORKFLOW_STEPS = [
  { id: 'configure', label: 'Configure quote' },
  { id: 'review', label: 'Review pricing' },
  { id: 'finalize', label: 'Finalize quote' },
  { id: 'deliver', label: 'Deliver proposal (PDF / email)' },
] as const;

export function StepComplete({
  quoteNumber,
  clientName,
  pricing,
  currency,
  pdfDownloaded,
  emailOpened,
}: StepCompleteProps) {
  const delivered = pdfDownloaded || emailOpened;

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <CheckCircle2 className="w-14 h-14 text-[var(--color-primary)] mx-auto mb-3" />
        <h2 className="text-2xl font-semibold">Quote Finalized</h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {quoteNumber} is ready to send to {clientName || 'your client'}
        </p>
      </div>

      <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Proposal Summary</span>
            <Badge>FINAL</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-muted-foreground)]">Quote Number</p>
              <p className="font-semibold">{quoteNumber}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Client</p>
              <p className="font-semibold">{clientName}</p>
            </div>
          </div>

          {pricing && (
            <>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-[var(--color-muted-foreground)]">Total Contract Value</span>
                <span className="text-xl font-bold text-[var(--color-primary)]">
                  {formatCurrency(pricing.totalContractValue, currency)}
                </span>
              </div>
              <SelectedPaymentDisplay option={pricing.paymentOption} currency={currency} compact />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {WORKFLOW_STEPS.map((item) => {
              const isDeliver = item.id === 'deliver';
              const done = isDeliver ? delivered : true;
              const current = isDeliver && !delivered;

              return (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                  ) : (
                    <Circle className={`w-5 h-5 shrink-0 ${current ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}`} />
                  )}
                  <span className={done ? 'text-[var(--color-foreground)]' : current ? 'font-medium text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}>
                    {item.label}
                    {current && ' — use the buttons below'}
                  </span>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>

      <p className="text-sm text-center text-[var(--color-muted-foreground)]">
        Download the PDF proposal or email it to your client to complete the workflow.
        You can also start a new quote when you are done.
      </p>
    </div>
  );
}

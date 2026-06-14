import { formatCurrency } from '@/lib/utils';
import type { QuotePaymentOption } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, CalendarClock } from 'lucide-react';

interface SelectedPaymentDisplayProps {
  option: QuotePaymentOption | null | undefined;
  currency: string;
  compact?: boolean;
}

export function SelectedPaymentDisplay({ option, currency, compact = false }: SelectedPaymentDisplayProps) {
  if (!option) return null;

  const isOneTime = option.type === 'ONE_TIME';

  if (compact) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] p-3 space-y-1">
        <p className="text-xs font-medium text-[var(--color-muted-foreground)]">{option.label}</p>
        {isOneTime ? (
          <p className="text-sm font-bold text-[var(--color-primary)]">
            {formatCurrency(option.upfrontPayment, currency)}
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-bold text-[var(--color-primary)]">
              {formatCurrency(option.upfrontPayment, currency)}
            </span>
            {' setup + '}
            <span className="font-bold text-[var(--color-primary)]">
              {formatCurrency(option.recurringPayment, currency)}/mo
            </span>
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className="border-2 border-[var(--color-primary)]/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isOneTime ? (
            <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
          ) : (
            <CalendarClock className="w-4 h-4 text-[var(--color-primary)]" />
          )}
          {option.label}
        </CardTitle>
        <CardDescription>{option.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isOneTime ? (
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)]">Due at signing</p>
            <p className="text-2xl font-bold text-[var(--color-primary)]">
              {formatCurrency(option.upfrontPayment, currency)}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Setup (upfront)</p>
              <p className="text-lg font-bold">{formatCurrency(option.upfrontPayment, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted-foreground)]">Monthly subscription</p>
              <p className="text-lg font-bold text-[var(--color-primary)]">
                {formatCurrency(option.recurringPayment, currency)}
                <span className="text-sm font-normal text-[var(--color-muted-foreground)]">/mo</span>
              </p>
            </div>
          </div>
        )}
        <div className="text-sm space-y-1 border-t pt-3">
          {!isOneTime && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Subscription term</span>
              <span>{option.recurringMonths} months</span>
            </div>
          )}
          {isOneTime && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Recurring charges</span>
              <span>None</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--color-muted-foreground)]">Total contract value</span>
            <span className="font-medium">{formatCurrency(option.totalContractValue, currency)}</span>
          </div>
          {option.taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Total with tax</span>
              <span className="font-semibold">{formatCurrency(option.totalWithTax, currency)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** @deprecated Use SelectedPaymentDisplay */
export function PaymentOptionsDisplay({
  options,
  currency,
  compact,
}: {
  options: QuotePaymentOption[];
  currency: string;
  compact?: boolean;
}) {
  return <SelectedPaymentDisplay option={options[0]} currency={currency} compact={compact} />;
}

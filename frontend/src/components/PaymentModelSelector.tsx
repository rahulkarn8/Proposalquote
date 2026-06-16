import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import type { PaymentModel } from '@/types';
import { CreditCard, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_MODELS: {
  value: PaymentModel;
  label: string;
  description: string;
  icon: typeof CreditCard;
}[] = [
  {
    value: 'ONE_TIME',
    label: 'One-Time Payment',
    description: 'Single upfront payment for the full contract value. No recurring invoices.',
    icon: CreditCard,
  },
  {
    value: 'MONTHLY_SUBSCRIPTION',
    label: 'Monthly Subscription',
    description: 'Setup fee at signing, then a fixed monthly fee for the contract term.',
    icon: CalendarClock,
  },
];

interface PaymentModelSelectorProps {
  form: UseFormReturn<QuoteFormValues>;
  compact?: boolean;
}

export function PaymentModelSelector({ form, compact = false }: PaymentModelSelectorProps) {
  const paymentModel = form.watch('paymentModel');

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {!compact && (
        <div>
          <Label>Quote Payment Model</Label>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            The proposal, preview, and PDF will be generated for this model only
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PAYMENT_MODELS.map((model) => {
          const Icon = model.icon;
          const selected = paymentModel === model.value;
          return (
            <button
              key={model.value}
              type="button"
              onClick={() => form.setValue('paymentModel', model.value, { shouldValidate: true })}
              className={cn(
                'text-left rounded-lg border-2 transition-colors',
                compact ? 'p-3' : 'p-4',
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40',
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={cn('w-5 h-5', selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]')} />
                <span className={cn('font-medium', compact && 'text-sm')}>{model.label}</span>
              </div>
              <p className={cn('text-[var(--color-muted-foreground)]', compact ? 'text-xs' : 'text-sm')}>
                {model.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

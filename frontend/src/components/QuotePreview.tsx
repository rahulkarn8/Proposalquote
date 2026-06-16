import { memo } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { PricingBreakdown } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { SelectedPaymentDisplay } from '@/components/PaymentOptionsDisplay';
import { HardwareBomSummary } from '@/components/HardwareBomTable';

interface QuotePreviewProps {
  pricing: PricingBreakdown | null;
  currency: string;
  contractMonths: number;
  isInitialLoad?: boolean;
  isRefreshing?: boolean;
}

export const QuotePreview = memo(function QuotePreview({
  pricing,
  currency,
  contractMonths,
  isInitialLoad,
  isRefreshing,
}: QuotePreviewProps) {
  if (isInitialLoad && !pricing) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Quote Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-[var(--color-muted)] rounded w-3/4" />
            <div className="h-4 bg-[var(--color-muted)] rounded w-1/2" />
            <div className="h-8 bg-[var(--color-muted)] rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricing) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Quote Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Fill in the form to see real-time pricing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`sticky top-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-80' : 'opacity-100'}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Quote Preview
            {isRefreshing && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-muted-foreground)]" />
            )}
          </span>
          <Badge variant="secondary">{currency}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pricing.paymentOption ? (
          <SelectedPaymentDisplay option={pricing.paymentOption} currency={currency} compact />
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Setup Fee</span>
              <span className="font-medium">{formatCurrency(pricing.setupFee, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted-foreground)]">Monthly (MRR)</span>
              <span className="font-medium">{formatCurrency(pricing.monthlyFee, currency)}</span>
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex justify-between">
            <span className="font-medium">Total Contract Value</span>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {formatCurrency(pricing.totalContractValue, currency)}
            </span>
          </div>
          {pricing.taxAmount > 0 && (
            <div className="flex justify-between mt-1">
              <span className="font-medium">Total with Tax</span>
              <span className="font-bold">{formatCurrency(pricing.totalWithTax, currency)}</span>
            </div>
          )}
          <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
            {contractMonths} month contract
          </p>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Quarterly (5% off)</span>
            <span>{formatCurrency(pricing.quarterlyFee, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Annual (15% off)</span>
            <span>{formatCurrency(pricing.annualFee, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Year 1 Cost</span>
            <span className="font-semibold">{formatCurrency(pricing.year1Cost, currency)}</span>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-medium mb-2">Breakdown</p>
          <div className="space-y-1 text-xs text-[var(--color-muted-foreground)]">
            <div className="flex justify-between">
              <span>Cloud</span>
              <span>{formatCurrency(pricing.cloudCostMonthly, currency)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>Support</span>
              <span>{formatCurrency(pricing.supportCostMonthly, currency)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>Maintenance</span>
              <span>{formatCurrency(pricing.maintenanceFeeMonthly, currency)}/mo</span>
            </div>
            <div className="flex justify-between">
              <span>Volume Processing</span>
              <span>{formatCurrency(pricing.volumeProcessingFee, currency)}/mo</span>
            </div>
            {pricing.hardwareCost > 0 && pricing.hardwareBom.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium">Hardware BOM</p>
                <HardwareBomSummary bom={pricing.hardwareBom} currency={currency} />
              </div>
            )}
          </div>
        </div>

        {pricing.warrantySurcharge > 0 && (
          <p className="text-xs text-amber-600">
            Extended warranty surcharge: +{(pricing.warrantySurcharge * 100).toFixed(0)}%
          </p>
        )}

        {pricing.volumeDiscount > 0 && (
          <p className="text-xs text-green-600">
            Volume tier: {pricing.volumeTierLabel} (-{(pricing.volumeDiscount * 100).toFixed(0)}%)
          </p>
        )}

        {pricing.requiresCustomPricing && (
          <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
            ⚠ Custom pricing required for this volume
          </p>
        )}
      </CardContent>
    </Card>
  );
});

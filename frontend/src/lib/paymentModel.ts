import type { PaymentModel, PricingBreakdown, PricingLineItem } from '@/types';

export function isOneTimePayment(model: PaymentModel | undefined): boolean {
  return model === 'ONE_TIME';
}

/** Line items formatted for the selected payment model in review / PDF-style summaries. */
export function getQuoteLineItemsForPaymentModel(pricing: PricingBreakdown): PricingLineItem[] {
  if (pricing.paymentModel !== 'ONE_TIME') {
    return pricing.lineItems;
  }

  const oneTimeItems = pricing.lineItems.filter((item) => !item.recurring);
  const recurringItems = pricing.lineItems.filter((item) => item.recurring);
  const recurringTotal = recurringItems.reduce((sum, item) => sum + item.total, 0);
  const taxItem = pricing.lineItems.find((item) => item.category === 'Tax');

  const rows: PricingLineItem[] = [...oneTimeItems.filter((item) => item.category !== 'Tax')];

  if (recurringTotal > 0) {
    const months = pricing.paymentOption?.recurringMonths || 0;
    rows.push({
      category: 'Platform & Operations',
      description: months > 0
        ? `Cloud, support, maintenance & volume processing (${months} months, included in upfront total)`
        : 'Cloud, support, maintenance & volume processing (included in upfront total)',
      quantity: 1,
      unitPrice: recurringTotal,
      total: recurringTotal,
      recurring: false,
      billingPeriod: 'ONE_TIME',
    });
  }

  if (taxItem) rows.push(taxItem);

  return rows;
}

import { PaymentModel, PricingBreakdown, PricingLineItem } from '../types';

export function isOneTimePayment(model: PaymentModel | undefined): boolean {
  return model === 'ONE_TIME';
}

export function getQuoteLineItemsForPaymentModel(pricing: PricingBreakdown): PricingLineItem[] {
  if (pricing.paymentModel !== 'ONE_TIME') {
    return pricing.lineItems.filter((item) => item.category !== 'Tax');
  }

  const oneTimeItems = pricing.lineItems.filter((item) => !item.recurring && item.category !== 'Tax');
  const recurringTotal = pricing.lineItems
    .filter((item) => item.recurring)
    .reduce((sum, item) => sum + item.total, 0);

  const rows: PricingLineItem[] = [...oneTimeItems];

  if (recurringTotal > 0) {
    const months = pricing.paymentOption?.recurringMonths ?? pricing.lineItems.find((i) => i.recurring)?.quantity ?? 0;
    rows.push({
      category: 'Platform & Operations',
      description: months
        ? `Cloud, support, maintenance & volume processing (${months} months, included in upfront total)`
        : 'Cloud, support, maintenance & volume processing (included in upfront total)',
      quantity: 1,
      unitPrice: recurringTotal,
      total: recurringTotal,
      recurring: false,
      billingPeriod: 'ONE_TIME',
    });
  }

  return rows;
}

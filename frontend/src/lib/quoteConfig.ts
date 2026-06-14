import { quoteFormSchema, QuoteFormValues } from '@/lib/schema';
import type { QuoteConfiguration } from '@/types';
import { DEFAULT_CONFIG } from '@/types';

/** Normalize react-hook-form values (string numbers from inputs) for API requests. */
export function toQuoteConfiguration(values: QuoteFormValues): QuoteConfiguration {
  return quoteFormSchema.parse(values);
}

/** Merge saved/legacy configs with defaults for form reset. */
export function normalizeLoadedConfig(config: Partial<QuoteConfiguration>): QuoteFormValues {
  return quoteFormSchema.parse({
    ...DEFAULT_CONFIG,
    clientName: config.clientName ?? '',
    problemStatement: config.problemStatement ?? '',
    paymentModel: config.paymentModel ?? 'MONTHLY_SUBSCRIPTION',
    ...config,
  });
}

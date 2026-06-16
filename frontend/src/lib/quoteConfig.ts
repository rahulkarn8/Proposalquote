import { quoteFormSchema, QuoteFormValues } from '@/lib/schema';
import type { QuoteConfiguration } from '@/types';
import { DEFAULT_CONFIG } from '@/types';
import { migrateLegacyHardwareBom } from '@/lib/hardwareBom';

/** Normalize react-hook-form values (string numbers from inputs) for API requests. */
export function toQuoteConfiguration(values: QuoteFormValues): QuoteConfiguration {
  return quoteFormSchema.parse(values);
}

/** Merge saved/legacy configs with defaults for form reset. */
export function normalizeLoadedConfig(config: Partial<QuoteConfiguration> & {
  hardwareDescription?: string;
  hardwareCost?: number;
}): QuoteFormValues {
  const includesHardware = config.includesHardware ?? false;
  const hardwareBom = migrateLegacyHardwareBom({
    includesHardware,
    hardwareBom: config.hardwareBom,
    hardwareDescription: config.hardwareDescription,
    hardwareCost: config.hardwareCost,
  });

  return quoteFormSchema.parse({
    ...DEFAULT_CONFIG,
    ...config,
    clientName: config.clientName ?? '',
    problemStatement: config.problemStatement ?? '',
    paymentModel: config.paymentModel ?? 'MONTHLY_SUBSCRIPTION',
    setupPricingMode: config.setupPricingMode ?? 'ENGINEERING_EFFORT',
    includesHardware,
    hardwareBom: includesHardware
      ? (config.hardwareBom?.length ? config.hardwareBom : hardwareBom)
      : [],
  });
}

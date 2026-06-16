import { z } from 'zod';

const hardwareBomLineSchema = z.object({
  item: z.string().min(1, 'Item description is required'),
  partNumber: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
});

const hardwareBomRefine = (data: { includesHardware: boolean; hardwareBom: z.infer<typeof hardwareBomLineSchema>[] }) => {
  if (!data.includesHardware) return true;
  return data.hardwareBom.length > 0 && data.hardwareBom.every((line) => line.item.trim().length > 0);
};

const hardwareBomTotalRefine = (data: { includesHardware: boolean; hardwareBom: z.infer<typeof hardwareBomLineSchema>[] }) => {
  if (!data.includesHardware) return true;
  const total = data.hardwareBom.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return total > 0;
};

const warrantyRefine = (data: { warrantyPeriod: number; warrantyUnit: string }) => {
  const months = data.warrantyUnit === 'months' ? data.warrantyPeriod : data.warrantyPeriod / 30;
  return months >= 0 && months <= 60;
};

const quoteConfigurationBase = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  problemStatement: z.string().min(20, 'Problem statement must be at least 20 characters').max(2000),
  problemType: z.string().min(1, 'Problem type is required'),
  volume: z.coerce.number().min(1, 'Minimum volume is 1').max(10_000_000, 'Maximum volume is 10,000,000'),
  volumeUnit: z.string().min(1, 'Volume unit is required'),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  engineeringEffort: z.coerce.number().min(0).max(2000, 'Maximum 2000 hours'),
  setupPricingMode: z.enum(['ENGINEERING_EFFORT', 'FEATURE_WISE']).default('ENGINEERING_EFFORT'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  startDate: z.string().min(1, 'Start date is required'),
  solutionCoverage: z.array(z.string()).min(1, 'Select at least one solution coverage option'),
  warrantyPeriod: z.coerce.number().min(0),
  warrantyUnit: z.enum(['days', 'months']),
  coverageType: z.enum(['DEFECTS_ONLY', 'PERFORMANCE_GUARANTEE', 'FULL_MAINTENANCE']),
  supportHours: z.enum(['BUSINESS_HOURS', '24x7', 'CUSTOM']),
  supportSLA: z.enum(['4HR', '8HR', '24HR', 'NEXT_BUSINESS_DAY']),
  supportCostModel: z.enum(['FIXED_MONTHLY', 'PERCENTAGE_OF_SUBSCRIPTION', 'PER_TICKET']),
  cloudProvider: z.enum(['AWS', 'AZURE', 'GCP', 'NONE']),
  estimatedMonthlyCloudCost: z.coerce.number().min(0).max(50_000, 'Maximum cloud cost is $50,000/month'),
  cloudCostModel: z.enum(['FIXED', 'VARIABLE_BY_VOLUME']),
  complianceRequirements: z.array(z.enum(['GDPR', 'HIPAA', 'SOC2', 'NONE'])).min(1),
  requiredLanguagesFrameworks: z.string().min(1, 'Required languages/frameworks is required'),
  integrationComplexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  expectedLifetime: z.coerce.number().min(1).max(60),
  paymentModel: z.enum(['ONE_TIME', 'MONTHLY_SUBSCRIPTION']),
  includesHardware: z.boolean(),
  hardwareBom: z.array(hardwareBomLineSchema),
});

const engineeringEffortRefine = (data: { setupPricingMode: string; engineeringEffort: number }) =>
  data.setupPricingMode === 'FEATURE_WISE' || (data.engineeringEffort >= 8 && data.engineeringEffort <= 2000);

export const quoteConfigurationSchema = quoteConfigurationBase
  .refine(warrantyRefine, {
    message: 'Warranty period must be between 0 and 60 months',
    path: ['warrantyPeriod'],
  })
  .refine(hardwareBomRefine, {
    message: 'Add at least one complete BOM line (item, quantity, unit price)',
    path: ['hardwareBom'],
  })
  .refine(hardwareBomTotalRefine, {
    message: 'Hardware BOM total must be greater than zero',
    path: ['hardwareBom'],
  })
  .refine(engineeringEffortRefine, {
    message: 'Engineering effort must be between 8 and 2000 hours',
    path: ['engineeringEffort'],
  });

export const createQuoteSchema = quoteConfigurationBase
  .extend({
    status: z.enum(['DRAFT', 'FINAL']).optional().default('DRAFT'),
  })
  .refine(warrantyRefine, {
    message: 'Warranty period must be between 0 and 60 months',
    path: ['warrantyPeriod'],
  })
  .refine(hardwareBomRefine, {
    message: 'Add at least one complete BOM line (item, quantity, unit price)',
    path: ['hardwareBom'],
  })
  .refine(hardwareBomTotalRefine, {
    message: 'Hardware BOM total must be greater than zero',
    path: ['hardwareBom'],
  })
  .refine(engineeringEffortRefine, {
    message: 'Engineering effort must be between 8 and 2000 hours',
    path: ['engineeringEffort'],
  });

export const calculateQuoteSchema = quoteConfigurationSchema;

export const compareScenariosSchema = z.object({
  base: quoteConfigurationSchema,
  scenarios: z.array(
    z.object({
      label: z.string(),
      overrides: quoteConfigurationBase.partial(),
    })
  ).min(1).max(3),
});

export const adminSettingsSchema = z.object({
  hourlyRates: z.object({
    LOW: z.number().min(0),
    MEDIUM: z.number().min(0),
    HIGH: z.number().min(0),
    VERY_HIGH: z.number().min(0),
  }),
  coverageMultipliers: z.record(z.string(), z.number().min(0).max(1)),
  setupFeeConfig: z.object({
    globalMultiplier: z.number().min(0),
    integrationMultipliers: z.object({
      LOW: z.number().min(0),
      MEDIUM: z.number().min(0),
      HIGH: z.number().min(0),
    }),
    complianceMultipliers: z.record(z.string(), z.number().min(0).max(1)),
    defaultCoverageMultiplier: z.number().min(0).max(1),
    maintenanceFeePercent: z.number().min(0).max(1),
    supportPercentOfSetup: z.number().min(0).max(1),
    perTicketSupportBase: z.number().min(0),
  }),
  supportTierPricing: z.object({
    baseSupportMonthly: z.number().min(0),
    slaMultipliers: z.record(z.string(), z.number().min(0)),
    hoursMultipliers: z.record(z.string(), z.number().min(0)),
    tierMultipliers: z.record(z.string(), z.number().min(0)),
  }),
  problemTypes: z.array(z.object({
    type: z.string(),
    label: z.string(),
    description: z.string(),
    category: z.string().optional(),
    baseComplexityFactors: z.object({
      LOW: z.number(), MEDIUM: z.number(), HIGH: z.number(), VERY_HIGH: z.number(),
    }),
    engineeringEffortRange: z.object({ min: z.number(), max: z.number(), typical: z.number() }),
    cloudCostMultiplier: z.number().min(0),
    supportTiers: z.array(z.object({ tier: z.string(), multiplier: z.number() })),
    volumeUnit: z.string(),
    perUnitProcessingRate: z.number().min(0),
  })),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  taxRate: z.number().min(0).max(100),
  cloudMarkup: z.number().min(0).max(1),
  volumeTiers: z.array(z.object({
    maxVolume: z.number(),
    discount: z.number().min(0).max(1),
    label: z.string(),
    requiresCustomPricing: z.boolean().optional(),
  })),
});

export const newProblemTypeSchema = z.object({
  type: z.string().min(1).regex(/^[A-Z][A-Z0-9_]*$/, 'Type must be UPPER_SNAKE_CASE'),
  label: z.string().min(1),
  description: z.string().min(1),
  volumeUnit: z.string().min(1),
  perUnitProcessingRate: z.number().min(0),
  cloudCostMultiplier: z.number().min(0).default(1.0),
});

export type QuoteConfigurationInput = z.infer<typeof quoteConfigurationBase>;

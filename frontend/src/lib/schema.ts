import { z } from 'zod';

const warrantyRefine = (data: { warrantyPeriod: number; warrantyUnit: string }) => {
  const months = data.warrantyUnit === 'months' ? data.warrantyPeriod : data.warrantyPeriod / 30;
  return months >= 0 && months <= 60;
};

export const quoteFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  problemStatement: z.string().min(20, 'Please provide a brief problem statement (min 20 characters)').max(2000),
  problemType: z.string().min(1, 'Problem type is required'),
  volume: z.coerce.number().min(1, 'Minimum volume is 1').max(10_000_000, 'Maximum volume is 10,000,000'),
  volumeUnit: z.string().min(1, 'Volume unit is required'),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
  engineeringEffort: z.coerce.number().min(8, 'Minimum 8 hours').max(2000, 'Maximum 2000 hours'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']),
  startDate: z.string().min(1, 'Start date is required'),
  solutionCoverage: z.array(z.string()).min(1, 'Select at least one coverage option'),
  warrantyPeriod: z.coerce.number().min(0),
  warrantyUnit: z.enum(['days', 'months']),
  coverageType: z.enum(['DEFECTS_ONLY', 'PERFORMANCE_GUARANTEE', 'FULL_MAINTENANCE']),
  supportHours: z.enum(['BUSINESS_HOURS', '24x7', 'CUSTOM']),
  supportSLA: z.enum(['4HR', '8HR', '24HR', 'NEXT_BUSINESS_DAY']),
  supportCostModel: z.enum(['FIXED_MONTHLY', 'PERCENTAGE_OF_SUBSCRIPTION', 'PER_TICKET']),
  cloudProvider: z.enum(['AWS', 'AZURE', 'GCP', 'NONE']),
  estimatedMonthlyCloudCost: z.coerce.number().min(0).max(50_000, 'Maximum $50,000/month'),
  cloudCostModel: z.enum(['FIXED', 'VARIABLE_BY_VOLUME']),
  complianceRequirements: z.array(z.enum(['GDPR', 'HIPAA', 'SOC2', 'NONE'])).min(1),
  requiredLanguagesFrameworks: z.string().min(1, 'Required'),
  integrationComplexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  expectedLifetime: z.coerce.number().min(1).max(60),
  paymentModel: z.enum(['ONE_TIME', 'MONTHLY_SUBSCRIPTION']),
}).refine(warrantyRefine, {
  message: 'Warranty must be 0–60 months',
  path: ['warrantyPeriod'],
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

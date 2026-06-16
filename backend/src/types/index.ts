export type ProblemType = string;

export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

export type CoverageType = 'DEFECTS_ONLY' | 'PERFORMANCE_GUARANTEE' | 'FULL_MAINTENANCE';

export type SupportHours = 'BUSINESS_HOURS' | '24x7' | 'CUSTOM';

export type SupportSLA = '4HR' | '8HR' | '24HR' | 'NEXT_BUSINESS_DAY';

export type SupportCostModel = 'FIXED_MONTHLY' | 'PERCENTAGE_OF_SUBSCRIPTION' | 'PER_TICKET';

export type CloudProvider = 'AWS' | 'AZURE' | 'GCP' | 'NONE';

export type CloudCostModel = 'FIXED' | 'VARIABLE_BY_VOLUME';

export type ComplianceRequirement = 'GDPR' | 'HIPAA' | 'SOC2' | 'NONE';

export type IntegrationComplexity = 'LOW' | 'MEDIUM' | 'HIGH';

export type SetupPricingMode = 'ENGINEERING_EFFORT' | 'FEATURE_WISE';

export type PaymentModel = 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION';

export interface HardwareBomLine {
  item: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
}

export interface EngineeringEffortLine {
  item: string;
  hours: number;
}

export type VolumeUnit = string;

export type WarrantyUnit = 'days' | 'months';

export const SOLUTION_COVERAGE_OPTIONS = [
  'Data preprocessing & cleaning',
  'Model training & fine-tuning',
  'API endpoint deployment',
  'Web dashboard for monitoring',
  'Integration with existing systems',
  'Custom UI/UX',
  'Documentation & training',
  'Source code ownership',
] as const;

export interface SolutionFeature {
  label: string;
  category: string;
  description: string;
  multiplier: number;
  recommended?: boolean;
}

export interface SolutionFeatureCatalogResponse {
  features: SolutionFeature[];
  categories: string[];
  recommended: SolutionFeature[];
}

export interface EngineeringEffortCatalogItem {
  label: string;
  category: string;
  description: string;
  defaultShare: number;
}

export interface EngineeringEffortCatalogResponse {
  efforts: EngineeringEffortCatalogItem[];
  categories: string[];
}

export type SolutionCoverage = (typeof SOLUTION_COVERAGE_OPTIONS)[number] | string;

export interface QuoteConfiguration {
  clientName: string;
  problemStatement: string;
  problemType: ProblemType;
  volume: number;
  volumeUnit: VolumeUnit;
  complexity: Complexity;
  engineeringEffort: number;
  setupPricingMode: SetupPricingMode;
  engineeringEffortBreakdown: EngineeringEffortLine[];
  currency: Currency;
  startDate: string;
  solutionCoverage: SolutionCoverage[];
  warrantyPeriod: number;
  warrantyUnit: WarrantyUnit;
  coverageType: CoverageType;
  supportHours: SupportHours;
  supportSLA: SupportSLA;
  supportCostModel: SupportCostModel;
  cloudProvider: CloudProvider;
  estimatedMonthlyCloudCost: number;
  cloudCostModel: CloudCostModel;
  complianceRequirements: ComplianceRequirement[];
  requiredLanguagesFrameworks: string;
  integrationComplexity: IntegrationComplexity;
  expectedLifetime: number;
  paymentModel: PaymentModel;
  includesHardware: boolean;
  hardwareBom: HardwareBomLine[];
}

export interface PricingLineItem {
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  recurring: boolean;
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
}

export interface QuotePaymentOption {
  type: 'ONE_TIME' | 'MONTHLY_SUBSCRIPTION';
  label: string;
  description: string;
  upfrontPayment: number;
  recurringPayment: number;
  recurringPeriod: 'MONTHLY' | null;
  recurringMonths: number;
  totalContractValue: number;
  taxAmount: number;
  totalWithTax: number;
}

export interface PricingBreakdown {
  setupFee: number;
  monthlyFee: number;
  quarterlyFee: number;
  annualFee: number;
  quarterlyDiscount: number;
  annualDiscount: number;
  year1Cost: number;
  totalContractValue: number;
  taxAmount: number;
  totalWithTax: number;
  paymentModel: PaymentModel;
  paymentOption: QuotePaymentOption;
  paymentOptions: QuotePaymentOption[];
  lineItems: PricingLineItem[];
  hourlyRate: number;
  complexityMultiplier: number;
  integrationMultiplier: number;
  coverageMultiplier: number;
  setupPricingMode: SetupPricingMode;
  effectiveEngineeringEffort: number;
  volumeProcessingFee: number;
  cloudCostMonthly: number;
  supportCostMonthly: number;
  maintenanceFeeMonthly: number;
  warrantySurcharge: number;
  volumeDiscount: number;
  volumeTierLabel: string;
  requiresCustomPricing: boolean;
  hardwareCost: number;
  hardwareBom: HardwareBomLine[];
}

export interface ProblemTypeFactors {
  type: ProblemType;
  label: string;
  description: string;
  category?: string;
  baseComplexityFactors: Record<Complexity, number>;
  engineeringEffortRange: { min: number; max: number; typical: number };
  cloudCostMultiplier: number;
  supportTiers: { tier: string; multiplier: number }[];
  volumeUnit: VolumeUnit;
  perUnitProcessingRate: number;
}

export interface ExchangeRates {
  base: string;
  rates: Record<Currency, number>;
  lastUpdated: string;
}

export interface VolumeTier {
  maxVolume: number;
  discount: number;
  label: string;
  requiresCustomPricing?: boolean;
}

export interface SupportTierPricing {
  baseSupportMonthly: number;
  slaMultipliers: Record<string, number>;
  hoursMultipliers: Record<string, number>;
  tierMultipliers: Record<string, number>;
}

export interface SetupFeeConfig {
  /** Blanket multiplier applied to final setup fee */
  globalMultiplier: number;
  integrationMultipliers: Record<'LOW' | 'MEDIUM' | 'HIGH', number>;
  complianceMultipliers: Record<string, number>;
  /** Added per custom coverage item not in the predefined list */
  defaultCoverageMultiplier: number;
  /** Monthly maintenance = setupFee × this / 12 */
  maintenanceFeePercent: number;
  /** When support model is % of subscription */
  supportPercentOfSetup: number;
  /** Base per-ticket support monthly cost */
  perTicketSupportBase: number;
}

export interface AdminSettings {
  hourlyRates: Record<Complexity, number>;
  coverageMultipliers: Record<string, number>;
  setupFeeConfig: SetupFeeConfig;
  supportTierPricing: SupportTierPricing;
  problemTypes: ProblemTypeFactors[];
  defaultCurrency: Currency;
  taxRate: number;
  cloudMarkup: number;
  volumeTiers: VolumeTier[];
}

export interface QuoteAnalytics {
  totalQuotes: number;
  draftQuotes: number;
  finalQuotes: number;
  expiredQuotes: number;
  totalRevenue: number;
  averageTCV: number;
  quotesByProblemType: Record<string, number>;
  quotesByCurrency: Record<string, number>;
  quotesByMonth: { month: string; count: number; revenue: number }[];
  recentQuotes: {
    id: string;
    quoteNumber: string;
    status: string;
    totalPrice: number;
    currency: string;
    problemType: string;
    createdAt: string;
  }[];
}

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
export type VolumeUnit = string;

export interface HardwareBomLine {
  item: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
}

export const VOLUME_UNITS = [
  'documents/month', 'images/day', 'requests/second', 'drawings/month', 'signals/hour',
  'batches/day', 'sensor readings/hour', 'production runs/day', 'work orders/day',
  'MWh/month', 'robots/coordinated', 'cameras/monitored', 'SKUs/month',
  'simulation runs/month', 'vehicles/fleet', 'control loops', 'inspections/day',
  'data points/hour', 'data streams', 'video streams', 'design iterations/month', 'edge devices',
] as const;
export type WarrantyUnit = 'days' | 'months';

export interface SolutionFeature {
  label: string;
  category: string;
  description: string;
  multiplier: number;
  recommended?: boolean;
}

export interface EngineeringEffortLine {
  item: string;
  hours: number;
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

export interface SolutionFeatureCatalogResponse {
  features: SolutionFeature[];
  categories: string[];
  recommended: SolutionFeature[];
}

/** Core platform features (legacy fallback when API unavailable) */
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
  solutionCoverage: string[];
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
  billingPeriod: string;
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

export interface QuoteSummary {
  id: string;
  quoteNumber: string;
  status: string;
  totalPrice: number;
  currency: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<Currency, number>;
  lastUpdated: string;
}

export interface SetupFeeConfig {
  globalMultiplier: number;
  integrationMultipliers: Record<'LOW' | 'MEDIUM' | 'HIGH', number>;
  complianceMultipliers: Record<string, number>;
  defaultCoverageMultiplier: number;
  maintenanceFeePercent: number;
  supportPercentOfSetup: number;
  perTicketSupportBase: number;
}

export interface AdminSettings {
  hourlyRates: Record<Complexity, number>;
  coverageMultipliers: Record<string, number>;
  setupFeeConfig: SetupFeeConfig;
  supportTierPricing: {
    baseSupportMonthly: number;
    slaMultipliers: Record<string, number>;
    hoursMultipliers: Record<string, number>;
    tierMultipliers: Record<string, number>;
  };
  problemTypes: ProblemTypeFactors[];
  defaultCurrency: Currency;
  taxRate: number;
  cloudMarkup: number;
  volumeTiers: { maxVolume: number; discount: number; label: string; requiresCustomPricing?: boolean }[];
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

export const SETUP_PRICING_MODE_LABELS: Record<SetupPricingMode, string> = {
  ENGINEERING_EFFORT: 'Engineering effort (hours × rate)',
  FEATURE_WISE: 'Feature-wise (selected scope items)',
};

export const COMPLEXITY_LABELS: Record<Complexity, string> = {
  LOW: 'Low — Junior engineer',
  MEDIUM: 'Medium — Mid-level',
  HIGH: 'High — Senior',
  VERY_HIGH: 'Very High — Architect',
};

export const DEFAULT_CONFIG: QuoteConfiguration = {
  clientName: '',
  problemStatement: '',
  problemType: 'OCR_READING',
  volume: 1000,
  volumeUnit: 'documents/month',
  complexity: 'MEDIUM',
  engineeringEffort: 200,
  setupPricingMode: 'ENGINEERING_EFFORT',
  engineeringEffortBreakdown: [],
  currency: 'USD',
  startDate: new Date().toISOString().split('T')[0],
  solutionCoverage: [],
  warrantyPeriod: 6,
  warrantyUnit: 'months',
  coverageType: 'DEFECTS_ONLY',
  supportHours: 'BUSINESS_HOURS',
  supportSLA: 'NEXT_BUSINESS_DAY',
  supportCostModel: 'FIXED_MONTHLY',
  cloudProvider: 'AWS',
  estimatedMonthlyCloudCost: 500,
  cloudCostModel: 'FIXED',
  complianceRequirements: ['NONE'],
  requiredLanguagesFrameworks: 'Python, TensorFlow, FastAPI',
  integrationComplexity: 'MEDIUM',
  expectedLifetime: 12,
  paymentModel: 'MONTHLY_SUBSCRIPTION',
  includesHardware: false,
  hardwareBom: [],
};

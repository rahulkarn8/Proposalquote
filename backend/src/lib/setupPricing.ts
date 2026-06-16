import {
  QuoteConfiguration,
  PricingLineItem,
  ProblemTypeFactors,
} from '../types';
import {
  getHourlyRate,
  getCoverageItemMultiplier,
  getFeatureCoverageSum,
  getIntegrationMultiplier,
  getComplianceMultiplier,
  getSetupGlobalMultiplier,
} from '../data/problemTypes';

export type SetupPricingMode = 'ENGINEERING_EFFORT' | 'FEATURE_WISE';

export interface SetupFeeResult {
  setupFee: number;
  effectiveEngineeringEffort: number;
  lineItems: PricingLineItem[];
}

export function resolveSetupPricingMode(config: QuoteConfiguration): SetupPricingMode {
  return config.setupPricingMode ?? 'ENGINEERING_EFFORT';
}

export function computeFeatureWiseEffort(
  problemFactors: ProblemTypeFactors,
  solutionCoverage: string[],
): number {
  const referenceHours = problemFactors.engineeringEffortRange.typical;
  const featureSum = getFeatureCoverageSum(solutionCoverage);
  return Math.round(referenceHours * featureSum);
}

export function calculateSetupFee(
  config: QuoteConfiguration,
  problemFactors: ProblemTypeFactors,
): SetupFeeResult {
  const mode = resolveSetupPricingMode(config);
  const hourlyRate = getHourlyRate(config.complexity);
  const complexityMultiplier = problemFactors.baseComplexityFactors[config.complexity];
  const integrationMultiplier = getIntegrationMultiplier(config.integrationComplexity);
  const complianceMultiplier = getComplianceMultiplier(config.complianceRequirements);
  const globalMultiplier = getSetupGlobalMultiplier();
  const scopeMultiplier = integrationMultiplier * complianceMultiplier * globalMultiplier;

  if (mode === 'FEATURE_WISE') {
    const referenceHours = problemFactors.engineeringEffortRange.typical;
    const projectUnitCost = hourlyRate * complexityMultiplier * referenceHours;
    const featureSum = getFeatureCoverageSum(config.solutionCoverage);
    const setupFee = projectUnitCost * featureSum * scopeMultiplier;
    const effectiveEngineeringEffort = computeFeatureWiseEffort(problemFactors, config.solutionCoverage);

    const lineItems: PricingLineItem[] = config.solutionCoverage.map((feature) => {
      const itemMultiplier = getCoverageItemMultiplier(feature);
      const total = projectUnitCost * itemMultiplier * scopeMultiplier;
      return {
        category: 'Setup & Engineering',
        description: `${feature} (${(itemMultiplier * 100).toFixed(0)}% of baseline)`,
        quantity: 1,
        unitPrice: total,
        total,
        recurring: false,
        billingPeriod: 'ONE_TIME',
      };
    });

    return { setupFee, effectiveEngineeringEffort, lineItems };
  }

  const baseSetupFee = config.engineeringEffort * hourlyRate * complexityMultiplier;
  const setupFee = baseSetupFee * scopeMultiplier;

  return {
    setupFee,
    effectiveEngineeringEffort: config.engineeringEffort,
    lineItems: [{
      category: 'Setup & Engineering',
      description: `${config.engineeringEffort}h engineering at $${hourlyRate}/hr (${config.complexity} complexity)`,
      quantity: 1,
      unitPrice: setupFee,
      total: setupFee,
      recurring: false,
      billingPeriod: 'ONE_TIME',
    }],
  };
}

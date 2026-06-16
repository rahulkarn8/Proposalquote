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
import {
  sumEngineeringBreakdown,
} from '../config/engineeringEffortCatalog';

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

  const breakdown = config.engineeringEffortBreakdown ?? [];
  const totalHours = breakdown.length > 0
    ? sumEngineeringBreakdown(breakdown)
    : config.engineeringEffort;
  const hourUnitCost = hourlyRate * complexityMultiplier * scopeMultiplier;
  const setupFee = totalHours * hourUnitCost;

  const activeLines = breakdown.filter((line) => line.hours > 0);
  const lineItems: PricingLineItem[] = activeLines.length > 0
    ? activeLines.map((line) => ({
        category: 'Setup & Engineering',
        description: `${line.item} (${line.hours}h)`,
        quantity: line.hours,
        unitPrice: hourUnitCost,
        total: line.hours * hourUnitCost,
        recurring: false,
        billingPeriod: 'ONE_TIME',
      }))
    : [{
        category: 'Setup & Engineering',
        description: `${totalHours}h engineering at $${hourlyRate}/hr (${config.complexity} complexity)`,
        quantity: 1,
        unitPrice: setupFee,
        total: setupFee,
        recurring: false,
        billingPeriod: 'ONE_TIME',
      }];

  return {
    setupFee,
    effectiveEngineeringEffort: totalHours,
    lineItems,
  };
}

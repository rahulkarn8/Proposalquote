import type { Complexity, ProblemTypeFactors, SetupPricingMode } from '@/types';
import type { PricingRates } from '@/lib/pricingRates';

export function getCoverageItemMultiplier(
  item: string,
  pricingRates: PricingRates,
): number {
  return pricingRates.coverageMultipliers[item] ?? pricingRates.defaultCoverageMultiplier;
}

export function getFeatureCoverageSum(
  coverage: string[],
  pricingRates: PricingRates,
): number {
  return coverage.reduce((sum, item) => sum + getCoverageItemMultiplier(item, pricingRates), 0);
}

export function computeFeatureWiseEffort(
  problemFactors: ProblemTypeFactors,
  solutionCoverage: string[],
  pricingRates: PricingRates,
): number {
  const referenceHours = problemFactors.engineeringEffortRange.typical;
  const featureSum = getFeatureCoverageSum(solutionCoverage, pricingRates);
  return Math.round(referenceHours * featureSum);
}

export function estimateFeatureCost(
  feature: string,
  params: {
    complexity: Complexity;
    problemFactors: ProblemTypeFactors;
    pricingRates: PricingRates;
  },
): number {
  const { complexity, problemFactors, pricingRates } = params;
  const hourlyRate = pricingRates.hourlyRates[complexity];
  const complexityMultiplier = problemFactors.baseComplexityFactors[complexity];
  const referenceHours = problemFactors.engineeringEffortRange.typical;
  const projectUnitCost = hourlyRate * complexityMultiplier * referenceHours;
  const itemMultiplier = getCoverageItemMultiplier(feature, pricingRates);
  return projectUnitCost * itemMultiplier;
}

export function estimateSetupFee(
  mode: SetupPricingMode,
  params: {
    engineeringEffort: number;
    complexity: Complexity;
    problemFactors: ProblemTypeFactors;
    pricingRates: PricingRates;
    solutionCoverage: string[];
  },
): number {
  const { engineeringEffort, complexity, problemFactors, pricingRates, solutionCoverage } = params;
  const hourlyRate = pricingRates.hourlyRates[complexity];
  const complexityMultiplier = problemFactors.baseComplexityFactors[complexity];

  if (mode === 'FEATURE_WISE') {
    const referenceHours = problemFactors.engineeringEffortRange.typical;
    const featureSum = getFeatureCoverageSum(solutionCoverage, pricingRates);
    return referenceHours * hourlyRate * complexityMultiplier * featureSum;
  }

  return engineeringEffort * hourlyRate * complexityMultiplier;
}

export function syncFeatureWiseEffort(
  problemFactors: ProblemTypeFactors,
  solutionCoverage: string[],
  pricingRates: PricingRates,
): number {
  const effort = computeFeatureWiseEffort(problemFactors, solutionCoverage, pricingRates);
  return Math.max(8, Math.min(2000, effort));
}

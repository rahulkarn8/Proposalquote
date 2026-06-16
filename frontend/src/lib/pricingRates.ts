import type { Complexity, ProblemTypeFactors } from '@/types';

export interface VolumeTier {
  maxVolume: number;
  discount: number;
  label: string;
  requiresCustomPricing?: boolean;
}

export interface PricingRates {
  hourlyRates: Record<Complexity, number>;
  volumeTiers: VolumeTier[];
  coverageMultipliers: Record<string, number>;
  defaultCoverageMultiplier: number;
}

const COMPLEXITY_DESCRIPTIONS: Record<Complexity, string> = {
  LOW: 'Low — Junior engineer',
  MEDIUM: 'Medium — Mid-level',
  HIGH: 'High — Senior',
  VERY_HIGH: 'Very High — Architect',
};

export function formatComplexityLabel(complexity: Complexity, hourlyRates: Record<Complexity, number>): string {
  const rate = hourlyRates[complexity];
  return `${COMPLEXITY_DESCRIPTIONS[complexity]} ($${rate.toLocaleString()}/hr)`;
}

export function getVolumeTier(volume: number, tiers: VolumeTier[]): VolumeTier & { requiresCustomPricing: boolean } {
  for (const tier of tiers) {
    if (tier.requiresCustomPricing) {
      if (volume <= tier.maxVolume) {
        return { ...tier, requiresCustomPricing: true };
      }
      continue;
    }
    if (volume <= tier.maxVolume) {
      return { ...tier, requiresCustomPricing: tier.requiresCustomPricing ?? false };
    }
  }
  const last = tiers[tiers.length - 1];
  return { ...last, requiresCustomPricing: last.requiresCustomPricing ?? true };
}

export function getProblemTypeFactors(
  problemTypes: ProblemTypeFactors[],
  problemType: string,
): ProblemTypeFactors | undefined {
  return problemTypes.find((p) => p.type === problemType);
}

import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ComplianceRequirement, IntegrationComplexity, ProblemTypeFactors, SolutionFeature } from '@/types';
import { SOLUTION_COVERAGE_OPTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { PricingRates } from '@/lib/pricingRates';
import { getProblemTypeFactors } from '@/lib/pricingRates';
import {
  estimateFeatureCost,
  estimateSetupFee,
  getCoverageItemMultiplier,
  syncFeatureWiseEffort,
} from '@/lib/setupPricing';

interface StepCoverageProps {
  form: UseFormReturn<QuoteFormValues>;
  problemTypes: ProblemTypeFactors[];
  pricingRates: PricingRates | null;
  solutionFeatures: SolutionFeature[];
  featureCategories: string[];
  recommendedFeatures: SolutionFeature[];
}

function buildFallbackFeatures(): SolutionFeature[] {
  return SOLUTION_COVERAGE_OPTIONS.map((label) => ({
    label,
    category: 'Core Platform',
    description: '',
    multiplier: 0.08,
  }));
}

export function StepCoverage({
  form,
  problemTypes,
  pricingRates,
  solutionFeatures,
  featureCategories,
  recommendedFeatures,
}: StepCoverageProps) {
  const [customCoverage, setCustomCoverage] = useState('');
  const coverage = form.watch('solutionCoverage') || [];
  const compliance = form.watch('complianceRequirements') || [];
  const setupPricingMode = form.watch('setupPricingMode');
  const complexity = form.watch('complexity');
  const problemType = form.watch('problemType');
  const currency = form.watch('currency');
  const factors = getProblemTypeFactors(problemTypes, problemType);

  const catalog = solutionFeatures.length > 0 ? solutionFeatures : buildFallbackFeatures();
  const categories = featureCategories.length > 0 ? featureCategories : ['Core Platform'];

  const featuresByCategory = useMemo(() => {
    const grouped = new Map<string, SolutionFeature[]>();
    for (const cat of categories) grouped.set(cat, []);
    for (const feature of catalog) {
      if (!grouped.has(feature.category)) grouped.set(feature.category, []);
      grouped.get(feature.category)!.push(feature);
    }
    return grouped;
  }, [catalog, categories]);

  const recommendedLabels = new Set(recommendedFeatures.map((f) => f.label));

  const syncEffortIfFeatureMode = (nextCoverage: string[]) => {
    if (setupPricingMode !== 'FEATURE_WISE' || !factors || !pricingRates) return;
    form.setValue('engineeringEffort', syncFeatureWiseEffort(factors, nextCoverage, pricingRates), {
      shouldValidate: true,
    });
  };

  const toggleCoverage = (item: string) => {
    const current = form.getValues('solutionCoverage') || [];
    const next = current.includes(item)
      ? current.filter((c) => c !== item)
      : [...current, item];
    form.setValue('solutionCoverage', next, { shouldValidate: true });
    syncEffortIfFeatureMode(next);
  };

  const toggleCompliance = (item: ComplianceRequirement) => {
    const current = form.getValues('complianceRequirements') || [];
    if (item === 'NONE') {
      form.setValue('complianceRequirements', ['NONE']);
      return;
    }
    const withoutNone = current.filter((c) => c !== 'NONE');
    if (withoutNone.includes(item)) {
      const next = withoutNone.filter((c) => c !== item);
      form.setValue('complianceRequirements', next.length ? next : ['NONE']);
    } else {
      form.setValue('complianceRequirements', [...withoutNone, item]);
    }
  };

  const addCustomCoverage = () => {
    if (customCoverage.trim() && !coverage.includes(customCoverage.trim())) {
      const next = [...coverage, customCoverage.trim()];
      form.setValue('solutionCoverage', next, { shouldValidate: true });
      syncEffortIfFeatureMode(next);
      setCustomCoverage('');
    }
  };

  const featureCostParams = factors && pricingRates
    ? { complexity, problemFactors: factors, pricingRates }
    : null;

  const estimatedSetup = factors && pricingRates
    ? estimateSetupFee(setupPricingMode, {
        engineeringEffort: form.watch('engineeringEffort'),
        complexity,
        problemFactors: factors,
        pricingRates,
        solutionCoverage: coverage,
      })
    : null;

  const catalogLabels = new Set(catalog.map((f) => f.label));
  const customOnly = coverage.filter((c) => !catalogLabels.has(c));

  const renderFeature = (feature: SolutionFeature) => {
    const selected = coverage.includes(feature.label);
    const featureCost = selected && featureCostParams
      ? estimateFeatureCost(feature.label, featureCostParams)
      : null;
    const weight = pricingRates
      ? getCoverageItemMultiplier(feature.label, pricingRates)
      : feature.multiplier;

    return (
      <label
        key={feature.label}
        className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-transparent hover:border-[var(--color-border)]"
      >
        <Checkbox
          className="mt-0.5"
          checked={selected}
          onCheckedChange={() => toggleCoverage(feature.label)}
        />
        <span className="text-sm flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span>{feature.label}</span>
            {recommendedLabels.has(feature.label) && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Recommended</Badge>
            )}
          </span>
          {feature.description && (
            <span className="block text-xs text-[var(--color-muted-foreground)] mt-0.5">{feature.description}</span>
          )}
          {setupPricingMode === 'FEATURE_WISE' && (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              Weight: {(weight * 100).toFixed(0)}%
              {selected && featureCost != null && (
                <span className="text-[var(--color-primary)] font-medium"> · {formatCurrency(featureCost, currency)}</span>
              )}
            </span>
          )}
        </span>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Coverage & Requirements</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {setupPricingMode === 'FEATURE_WISE'
            ? 'Select AI solution features — each contributes to the setup fee using admin feature weights'
            : 'Select solution components and compliance requirements'}
        </p>
      </div>

      {recommendedFeatures.length > 0 && (
        <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recommended for this problem type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recommendedFeatures.map(renderFeature)}
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {categories.map((category) => {
          const features = featuresByCategory.get(category) ?? [];
          if (features.length === 0) return null;
          const nonRecommended = features.filter((f) => !recommendedLabels.has(f.label));
          if (nonRecommended.length === 0 && recommendedFeatures.length > 0) return null;

          return (
            <div key={category} className="space-y-2">
              <Label className="text-base">{category}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(recommendedFeatures.length > 0 ? nonRecommended : features).map(renderFeature)}
              </div>
            </div>
          );
        })}
      </div>

      {customOnly.length > 0 && (
        <div className="space-y-2">
          <Label>Custom features</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customOnly.map((custom) => {
              const featureCost = featureCostParams
                ? estimateFeatureCost(custom, featureCostParams)
                : null;
              return (
                <label key={custom} className="flex items-start gap-2 cursor-pointer p-2 rounded-md border border-[var(--color-border)]">
                  <Checkbox className="mt-0.5" checked onCheckedChange={() => toggleCoverage(custom)} />
                  <span className="text-sm italic flex-1">
                    {custom}
                    {setupPricingMode === 'FEATURE_WISE' && featureCost != null && (
                      <span className="block text-xs text-[var(--color-primary)] font-medium not-italic">
                        {formatCurrency(featureCost, currency)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add custom coverage option"
          value={customCoverage}
          onChange={(e) => setCustomCoverage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCoverage())}
        />
        <Button type="button" variant="outline" onClick={addCustomCoverage}>Add</Button>
      </div>
      {form.formState.errors.solutionCoverage && (
        <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.solutionCoverage.message}</p>
      )}

      {setupPricingMode === 'FEATURE_WISE' && estimatedSetup != null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feature-wise Setup Estimate</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium text-[var(--color-primary)]">
              {formatCurrency(estimatedSetup, currency)} setup (before integration & compliance)
            </p>
            <p className="text-[var(--color-muted-foreground)]">
              Based on {coverage.length} selected feature{coverage.length === 1 ? '' : 's'} and {factors?.engineeringEffortRange.typical ?? '—'}h problem-type baseline
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Label>Compliance Requirements</Label>
        <div className="flex flex-wrap gap-4">
          {(['GDPR', 'HIPAA', 'SOC2', 'NONE'] as ComplianceRequirement[]).map((req) => (
            <label key={req} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={compliance.includes(req)}
                onCheckedChange={() => toggleCompliance(req)}
              />
              <span className="text-sm">{req}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Required Languages & Frameworks</Label>
        <Textarea {...form.register('requiredLanguagesFrameworks')} placeholder="e.g. Python, TensorFlow, React, FastAPI" />
      </div>

      <div className="space-y-2">
        <Label>Integration Complexity</Label>
        <Select
          value={form.watch('integrationComplexity')}
          onValueChange={(v) => form.setValue('integrationComplexity', v as IntegrationComplexity)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low — Standalone deployment</SelectItem>
            <SelectItem value="MEDIUM">Medium — API integrations</SelectItem>
            <SelectItem value="HIGH">High — Legacy system integration</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

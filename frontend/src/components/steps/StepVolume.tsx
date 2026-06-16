import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VOLUME_UNITS, SETUP_PRICING_MODE_LABELS } from '@/types';
import type { Complexity, Currency, ProblemTypeFactors, SetupPricingMode } from '@/types';
import { getVolumeUnits } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  formatComplexityLabel,
  getProblemTypeFactors,
  getVolumeTier,
  type PricingRates,
} from '@/lib/pricingRates';
import { estimateSetupFee } from '@/lib/setupPricing';
import { HelpCircle } from 'lucide-react';

interface StepVolumeProps {
  form: UseFormReturn<QuoteFormValues>;
  problemTypes: ProblemTypeFactors[];
  pricingRates: PricingRates | null;
}

const COMPLEXITY_LEVELS: Complexity[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export function StepVolume({ form, problemTypes, pricingRates }: StepVolumeProps) {
  const complexity = form.watch('complexity');
  const volume = form.watch('volume');
  const engineeringEffort = form.watch('engineeringEffort');
  const problemType = form.watch('problemType');
  const setupPricingMode = form.watch('setupPricingMode');
  const solutionCoverage = form.watch('solutionCoverage');
  const currency = form.watch('currency');
  const complexityIndex = COMPLEXITY_LEVELS.indexOf(complexity);
  const [volumeUnits, setVolumeUnits] = useState<string[]>([...VOLUME_UNITS]);

  useEffect(() => {
    getVolumeUnits().then(setVolumeUnits).catch(() => setVolumeUnits([...VOLUME_UNITS]));
  }, []);

  const currentUnit = form.watch('volumeUnit');
  const allUnits = volumeUnits.includes(currentUnit)
    ? volumeUnits
    : [currentUnit, ...volumeUnits];

  const factors = getProblemTypeFactors(problemTypes, problemType);
  const hourlyRate = pricingRates?.hourlyRates[complexity] ?? null;
  const complexityMultiplier = factors?.baseComplexityFactors[complexity] ?? 1;
  const perUnitBase = factors?.perUnitProcessingRate ?? 0;
  const perUnitRate = perUnitBase * complexityMultiplier;
  const volumeTier = pricingRates
    ? getVolumeTier(volume, pricingRates.volumeTiers)
    : null;
  const estimatedSetup = pricingRates && factors
    ? estimateSetupFee(setupPricingMode, {
        engineeringEffort,
        complexity,
        problemFactors: factors,
        pricingRates,
        solutionCoverage,
      })
    : null;
  const estimatedVolumeMonthly = volumeTier
    ? volume * perUnitRate * (1 - volumeTier.discount)
    : null;

  const complexityLabel = pricingRates
    ? formatComplexityLabel(complexity, pricingRates.hourlyRates)
    : COMPLEXITY_LEVELS[complexityIndex] ?? complexity;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Volume & Complexity</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Define processing volume, complexity, and how setup cost is calculated
          </p>
        </div>

        <div className="space-y-2">
          <Label>Setup Pricing Method</Label>
          <Select
            value={setupPricingMode}
            onValueChange={(v) => form.setValue('setupPricingMode', v as SetupPricingMode, { shouldValidate: true })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(SETUP_PRICING_MODE_LABELS) as SetupPricingMode[]).map((mode) => (
                <SelectItem key={mode} value={mode}>{SETUP_PRICING_MODE_LABELS[mode]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {setupPricingMode === 'ENGINEERING_EFFORT'
              ? 'Enter total engineering hours below. Allocate hours by effort area on the Coverage step.'
              : 'Setup fee is built from selected solution features on the Coverage step (admin feature weights).'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Volume</Label>
            <Input type="number" {...form.register('volume')} min={1} max={10000000} />
            {form.formState.errors.volume && (
              <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.volume.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Volume Unit</Label>
            <Select value={currentUnit} onValueChange={(v) => form.setValue('volumeUnit', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-60">
                {allUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label>Complexity</Label>
            <Tooltip>
              <TooltipTrigger><HelpCircle className="w-4 h-4 text-[var(--color-muted-foreground)]" /></TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Hourly rates and processing fees come from admin pricing settings. Higher complexity uses higher rates and multipliers.
              </TooltipContent>
            </Tooltip>
          </div>
          <Slider
            value={[complexityIndex >= 0 ? complexityIndex : 1]}
            min={0}
            max={3}
            step={1}
            onValueChange={([v]) => form.setValue('complexity', COMPLEXITY_LEVELS[v])}
          />
          <p className="text-sm font-medium">{complexityLabel}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {setupPricingMode === 'ENGINEERING_EFFORT' ? (
            <div className="space-y-2">
              <Label>Engineering Effort (hours)</Label>
              <Input type="number" {...form.register('engineeringEffort')} min={8} max={2000} />
              {form.formState.errors.engineeringEffort && (
                <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.engineeringEffort.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Derived Engineering Effort (hours)</Label>
              <Input type="number" value={engineeringEffort} readOnly disabled />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Auto-calculated from selected features and problem type baseline
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => form.setValue('currency', v as Currency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
                <SelectItem value="INR">INR — Indian Rupee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input type="date" {...form.register('startDate')} />
        </div>

        {pricingRates && factors && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pricing from Admin Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--color-muted-foreground)]">Engineering Rate</p>
                <p className="font-medium">
                  {hourlyRate != null ? `${formatCurrency(hourlyRate, currency)}/hr` : '—'}
                  <span className="text-[var(--color-muted-foreground)] font-normal"> × {complexityMultiplier} complexity</span>
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted-foreground)]">
                  Est. Setup ({setupPricingMode === 'FEATURE_WISE' ? 'feature-wise' : 'effort-wise'})
                </p>
                <p className="font-medium">
                  {estimatedSetup != null ? formatCurrency(estimatedSetup, currency) : '—'}
                  <span className="text-[var(--color-muted-foreground)] font-normal"> before integration & compliance</span>
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted-foreground)]">Per-Unit Processing</p>
                <p className="font-medium">
                  {formatCurrency(perUnitRate, currency)}/{factors.volumeUnit.split('/').pop() ?? 'unit'}
                  <span className="text-[var(--color-muted-foreground)] font-normal"> (${perUnitBase}/unit × {complexityMultiplier})</span>
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted-foreground)]">Volume Tier</p>
                <p className="font-medium">
                  {volumeTier?.label ?? '—'}
                  {volumeTier && volumeTier.discount > 0 && (
                    <span className="text-green-600 font-normal"> ({(volumeTier.discount * 100).toFixed(0)}% off)</span>
                  )}
                  {volumeTier?.requiresCustomPricing && (
                    <span className="text-amber-600 font-normal"> — custom pricing required</span>
                  )}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-[var(--color-muted-foreground)]">Est. Monthly Volume Processing</p>
                <p className="font-medium">
                  {estimatedVolumeMonthly != null ? `${formatCurrency(estimatedVolumeMonthly, currency)}/mo` : '—'}
                  {volume > 0 && (
                    <span className="text-[var(--color-muted-foreground)] font-normal">
                      {' '}({volume.toLocaleString()} {factors.volumeUnit})
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

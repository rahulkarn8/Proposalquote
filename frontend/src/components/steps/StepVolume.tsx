import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { COMPLEXITY_LABELS, VOLUME_UNITS } from '@/types';
import type { Complexity, Currency } from '@/types';
import { getVolumeUnits } from '@/lib/api';
import { HelpCircle } from 'lucide-react';

interface StepVolumeProps {
  form: UseFormReturn<QuoteFormValues>;
}

const COMPLEXITY_LEVELS: Complexity[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export function StepVolume({ form }: StepVolumeProps) {
  const complexity = form.watch('complexity');
  const complexityIndex = COMPLEXITY_LEVELS.indexOf(complexity);
  const [volumeUnits, setVolumeUnits] = useState<string[]>([...VOLUME_UNITS]);

  useEffect(() => {
    getVolumeUnits().then(setVolumeUnits).catch(() => setVolumeUnits([...VOLUME_UNITS]));
  }, []);

  const currentUnit = form.watch('volumeUnit');
  const allUnits = volumeUnits.includes(currentUnit)
    ? volumeUnits
    : [currentUnit, ...volumeUnits];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Volume & Complexity</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Define processing volume, complexity, and engineering scope
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
                Complexity affects hourly rates and processing fees. Higher complexity requires more specialized engineering.
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
          <p className="text-sm font-medium">{COMPLEXITY_LABELS[complexity]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Engineering Effort (hours)</Label>
            <Input type="number" {...form.register('engineeringEffort')} min={8} max={2000} />
            {form.formState.errors.engineeringEffort && (
              <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.engineeringEffort.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={form.watch('currency')} onValueChange={(v) => form.setValue('currency', v as Currency)}>
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
      </div>
    </TooltipProvider>
  );
}

import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Input } from '@/components/ui/input';
import { FeatureCategoryCollapsible } from '@/components/FeatureCategoryCollapsible';
import type { EngineeringEffortCatalogItem } from '@/types';
import {
  groupEngineeringBreakdown,
  sumEngineeringBreakdown,
} from '@/lib/engineeringEfforts';

interface EngineeringEffortTableProps {
  form: UseFormReturn<QuoteFormValues>;
  efforts: EngineeringEffortCatalogItem[];
  categories: string[];
}

export function EngineeringEffortTable({ form, efforts, categories }: EngineeringEffortTableProps) {
  const breakdown = form.watch('engineeringEffortBreakdown') ?? [];
  const targetTotal = form.watch('engineeringEffort');

  const grouped = useMemo(
    () => groupEngineeringBreakdown(breakdown, efforts, categories),
    [breakdown, efforts, categories],
  );

  const allocatedTotal = sumEngineeringBreakdown(breakdown);

  const updateHours = (item: string, hours: number) => {
    const next = breakdown.map((line) =>
      line.item === item ? { ...line, hours: Math.max(0, Math.min(2000, hours)) } : line,
    );
    form.setValue('engineeringEffortBreakdown', next, { shouldValidate: true });
    form.setValue('engineeringEffort', sumEngineeringBreakdown(next), { shouldValidate: true });
  };

  const hoursForCategory = (category: string) => {
    const group = grouped.find((entry) => entry.category === category);
    return group ? sumEngineeringBreakdown(group.lines) : 0;
  };

  const itemCountForCategory = (category: string) => {
    const labels = new Set(
      efforts.filter((effort) => effort.category === category).map((effort) => effort.label),
    );
    return breakdown.filter((line) => labels.has(line.item)).length;
  };

  if (efforts.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Loading engineering effort catalog…
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {allocatedTotal}h allocated across {breakdown.filter((line) => line.hours > 0).length} effort areas
        {targetTotal !== allocatedTotal && (
          <span className="text-[var(--color-destructive)]"> · target {targetTotal}h</span>
        )}
      </p>
      {categories.map((category) => {
        const categoryEfforts = efforts.filter((effort) => effort.category === category);
        if (categoryEfforts.length === 0) return null;

        return (
          <FeatureCategoryCollapsible
            key={category}
            title={category}
            featureCount={itemCountForCategory(category)}
            selectedCount={hoursForCategory(category)}
            summaryText={`${hoursForCategory(category)}h allocated`}
            defaultOpen={category === 'Discovery & Design'}
          >
            {categoryEfforts.map((effort) => {
              const line = breakdown.find((entry) => entry.item === effort.label);
              const hours = line?.hours ?? 0;

              return (
                <div
                  key={effort.label}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-muted)]/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{effort.label}</p>
                    {effort.description && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                        {effort.description}
                      </p>
                    )}
                  </div>
                  <div className="w-24 shrink-0">
                    <Input
                      type="number"
                      min={0}
                      max={2000}
                      value={hours}
                      onChange={(event) => updateHours(effort.label, Number(event.target.value) || 0)}
                      aria-label={`Hours for ${effort.label}`}
                    />
                    <p className="text-[10px] text-[var(--color-muted-foreground)] text-right mt-0.5">hours</p>
                  </div>
                </div>
              );
            })}
          </FeatureCategoryCollapsible>
        );
      })}
      {form.formState.errors.engineeringEffortBreakdown && (
        <p className="text-xs text-[var(--color-destructive)]">
          {form.formState.errors.engineeringEffortBreakdown.message}
        </p>
      )}
    </div>
  );
}

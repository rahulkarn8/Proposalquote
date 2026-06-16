import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SolutionFeature } from '@/types';

interface SolutionCoverageSummaryProps {
  selected: string[];
  solutionFeatures?: SolutionFeature[];
  featureCategories?: string[];
}

function buildCategoryLookup(features: SolutionFeature[]): Map<string, string> {
  return new Map(features.map((f) => [f.label, f.category]));
}

export function SolutionCoverageSummary({
  selected,
  solutionFeatures = [],
  featureCategories = [],
}: SolutionCoverageSummaryProps) {
  const lookup = useMemo(() => buildCategoryLookup(solutionFeatures), [solutionFeatures]);

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const label of selected) {
      const category = lookup.get(label) ?? 'Custom / Other';
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(label);
    }
    const order = featureCategories.length > 0 ? featureCategories : [...map.keys()];
    return order
      .filter((cat) => map.has(cat))
      .map((category) => ({ category, features: map.get(category)! }));
  }, [selected, lookup, featureCategories]);

  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(grouped.map((g) => g.category)),
  );

  if (selected.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No features selected</p>;
  }

  const toggle = (category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {selected.length} feature{selected.length === 1 ? '' : 's'} across {grouped.length} categor{grouped.length === 1 ? 'y' : 'ies'}
      </p>
      {grouped.map(({ category, features }) => {
        const open = openCategories.has(category);
        return (
          <div key={category} className="rounded-md border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-2 p-2.5 text-left text-sm hover:bg-[var(--color-muted)]/30"
            >
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              <span className="flex-1 font-medium">{category}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">{features.length}</span>
            </button>
            {open && (
              <ul className="px-3 pb-2.5 pt-0 space-y-1 border-t border-[var(--color-border)]">
                {features.map((feature) => (
                  <li key={feature} className="text-sm text-[var(--color-muted-foreground)] pl-6 pt-1.5">
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { EngineeringEffortCatalogItem, EngineeringEffortLine } from '@/types';
import { groupEngineeringBreakdown, sumEngineeringBreakdown } from '@/lib/engineeringEfforts';

interface EngineeringEffortSummaryProps {
  breakdown: EngineeringEffortLine[];
  efforts?: EngineeringEffortCatalogItem[];
  categories?: string[];
}

export function EngineeringEffortSummary({
  breakdown,
  efforts = [],
  categories = [],
}: EngineeringEffortSummaryProps) {
  const activeLines = breakdown.filter((line) => line.hours > 0);
  const grouped = useMemo(
    () => groupEngineeringBreakdown(activeLines, efforts, categories),
    [activeLines, efforts, categories],
  );

  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(grouped.map((group) => group.category)),
  );

  if (activeLines.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">No engineering hours allocated</p>;
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
        {sumEngineeringBreakdown(activeLines)}h across {activeLines.length} effort area{activeLines.length === 1 ? '' : 's'}
      </p>
      {grouped.map(({ category, lines }) => {
        const open = openCategories.has(category);
        const categoryHours = sumEngineeringBreakdown(lines);
        return (
          <div key={category} className="rounded-md border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-2 p-2.5 text-left text-sm hover:bg-[var(--color-muted)]/30"
            >
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
              <span className="flex-1 font-medium">{category}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">{categoryHours}h</span>
            </button>
            {open && (
              <ul className="px-3 pb-2.5 pt-0 space-y-1 border-t border-[var(--color-border)]">
                {lines.map((line) => (
                  <li key={line.item} className="text-sm text-[var(--color-muted-foreground)] pl-6 pt-1.5 flex justify-between gap-4">
                    <span>{line.item}</span>
                    <span className="font-medium text-[var(--color-foreground)]">{line.hours}h</span>
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

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeatureCategoryCollapsibleProps {
  title: string;
  featureCount: number;
  selectedCount: number;
  defaultOpen?: boolean;
  highlighted?: boolean;
  summaryText?: string;
  children: React.ReactNode;
}

export function FeatureCategoryCollapsible({
  title,
  featureCount,
  selectedCount,
  defaultOpen = false,
  highlighted = false,
  summaryText,
  children,
}: FeatureCategoryCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-md border ${
        highlighted ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/5' : 'border-[var(--color-border)]'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--color-muted)]/30 transition-colors rounded-md"
        aria-expanded={open}
      >
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
        <span className="flex-1 font-medium text-sm">{title}</span>
        {highlighted && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Recommended</Badge>
        )}
        <span className="text-xs text-[var(--color-muted-foreground)] whitespace-nowrap">
          {summaryText ?? `${selectedCount}/${featureCount} selected`}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-0 border-t border-[var(--color-border)]">
          <div className="grid grid-cols-1 gap-1 pt-2">{children}</div>
        </div>
      )}
    </div>
  );
}

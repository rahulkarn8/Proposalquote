import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
      secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
      outline: 'border border-[var(--color-border)] text-[var(--color-foreground)]',
    };
    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors', variants[variant], className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  'Client',
  'Volume',
  'Coverage',
  'Warranty',
  'Cloud',
  'Review',
  'Complete',
];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                  isCompleted && 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white',
                  isCurrent && 'border-[var(--color-primary)] text-[var(--color-primary)]',
                  !isCompleted && !isCurrent && 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 hidden sm:block',
                  isCurrent ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-muted-foreground)]'
                )}
              >
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  isCompleted ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { STEPS };

import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProblemTypeFactors } from '@/types';

interface StepProblemProps {
  form: UseFormReturn<QuoteFormValues>;
  problemTypes: ProblemTypeFactors[];
}

export function StepProblem({ form, problemTypes }: StepProblemProps) {
  const selected = form.watch('problemType');
  const factors = problemTypes.find((p) => p.type === selected);

  const grouped = useMemo(() => {
    const groups = new Map<string, ProblemTypeFactors[]>();
    for (const pt of problemTypes) {
      const cat = pt.category ?? 'Other';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(pt);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [problemTypes]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Client & Problem</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Enter the client details and a brief problem statement — these appear in the PDF proposal
        </p>
      </div>

      <div className="space-y-2">
        <Label>Client Name</Label>
        <Input
          {...form.register('clientName')}
          placeholder="e.g. Acme Manufacturing Ltd."
        />
        {form.formState.errors.clientName && (
          <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.clientName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Problem Statement</Label>
        <Textarea
          {...form.register('problemStatement')}
          placeholder="Briefly describe the business challenge, current pain points, and desired outcome. This will form the executive summary in the proposal."
          rows={4}
        />
        {form.formState.errors.problemStatement && (
          <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.problemStatement.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Problem Type</Label>
        <Select
          value={selected}
          onValueChange={(v) => {
            form.setValue('problemType', v);
            const pt = problemTypes.find((p) => p.type === v);
            if (pt) {
              form.setValue('volumeUnit', pt.volumeUnit);
              form.setValue('engineeringEffort', pt.engineeringEffortRange.typical);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a problem type" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {grouped.map(([category, types]) => (
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {types.map((pt) => (
                  <SelectItem key={pt.type} value={pt.type}>{pt.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {factors && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{factors.label}</CardTitle>
            {factors.category && (
              <p className="text-xs text-[var(--color-primary)] font-medium">{factors.category}</p>
            )}
            <CardDescription>{factors.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-muted-foreground)]">Typical Effort</p>
              <p className="font-medium">{factors.engineeringEffortRange.typical} hours</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Effort Range</p>
              <p className="font-medium">{factors.engineeringEffortRange.min}–{factors.engineeringEffortRange.max}h</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Volume Unit</p>
              <p className="font-medium">{factors.volumeUnit}</p>
            </div>
            <div>
              <p className="text-[var(--color-muted-foreground)]">Cloud Multiplier</p>
              <p className="font-medium">{factors.cloudCostMultiplier}x</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

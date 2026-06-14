import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SOLUTION_COVERAGE_OPTIONS } from '@/types';
import type { ComplianceRequirement, IntegrationComplexity } from '@/types';
import { Button } from '@/components/ui/button';

interface StepCoverageProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function StepCoverage({ form }: StepCoverageProps) {
  const [customCoverage, setCustomCoverage] = useState('');
  const coverage = form.watch('solutionCoverage') || [];
  const compliance = form.watch('complianceRequirements') || [];

  const toggleCoverage = (item: string) => {
    const current = form.getValues('solutionCoverage') || [];
    if (current.includes(item)) {
      form.setValue('solutionCoverage', current.filter((c) => c !== item));
    } else {
      form.setValue('solutionCoverage', [...current, item]);
    }
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
      form.setValue('solutionCoverage', [...coverage, customCoverage.trim()]);
      setCustomCoverage('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Coverage & Requirements</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Select solution components and compliance requirements
        </p>
      </div>

      <div className="space-y-3">
        <Label>Solution Coverage</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOLUTION_COVERAGE_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={coverage.includes(option)}
                onCheckedChange={() => toggleCoverage(option)}
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
          {coverage.filter((c) => !SOLUTION_COVERAGE_OPTIONS.includes(c as typeof SOLUTION_COVERAGE_OPTIONS[number])).map((custom) => (
            <label key={custom} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked onCheckedChange={() => toggleCoverage(custom)} />
              <span className="text-sm italic">{custom}</span>
            </label>
          ))}
        </div>
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
      </div>

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

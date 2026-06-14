import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CoverageType, SupportHours, SupportSLA, SupportCostModel, WarrantyUnit } from '@/types';
import { SupportClauseSummary } from '@/components/SupportClauseSummary';
import { warrantyMonths } from '@/lib/labels';

interface StepWarrantyProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function StepWarranty({ form }: StepWarrantyProps) {
  const warrantyPeriod = form.watch('warrantyPeriod');
  const warrantyUnit = form.watch('warrantyUnit');
  const months = warrantyMonths(warrantyPeriod, warrantyUnit);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Warranty & Support</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Configure warranty terms and ongoing support levels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Warranty Period</Label>
          <Input type="number" {...form.register('warrantyPeriod')} min={0} />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={form.watch('warrantyUnit')} onValueChange={(v) => form.setValue('warrantyUnit', v as WarrantyUnit)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Coverage Type</Label>
          <Select value={form.watch('coverageType')} onValueChange={(v) => form.setValue('coverageType', v as CoverageType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DEFECTS_ONLY">Defects Only</SelectItem>
              <SelectItem value="PERFORMANCE_GUARANTEE">Performance Guarantee</SelectItem>
              <SelectItem value="FULL_MAINTENANCE">Full Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {Number(warrantyPeriod) > 0 && (
        <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
          Bug fixes included at no additional cost during the warranty period.
          {warrantyUnit === 'months' && months > 12 && (
            <span className="block mt-1">Extended warranty (&gt;12 months) adds 10% to monthly fee.</span>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Support Hours</Label>
          <Select value={form.watch('supportHours')} onValueChange={(v) => form.setValue('supportHours', v as SupportHours)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BUSINESS_HOURS">Business Hours</SelectItem>
              <SelectItem value="24x7">24×7</SelectItem>
              <SelectItem value="CUSTOM">Custom Schedule</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Support SLA</Label>
          <Select value={form.watch('supportSLA')} onValueChange={(v) => form.setValue('supportSLA', v as SupportSLA)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="4HR">4 Hour Response</SelectItem>
              <SelectItem value="8HR">8 Hour Response</SelectItem>
              <SelectItem value="24HR">24 Hour Response</SelectItem>
              <SelectItem value="NEXT_BUSINESS_DAY">Next Business Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Support Cost Model</Label>
          <Select value={form.watch('supportCostModel')} onValueChange={(v) => form.setValue('supportCostModel', v as SupportCostModel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED_MONTHLY">Fixed Monthly</SelectItem>
              <SelectItem value="PERCENTAGE_OF_SUBSCRIPTION">% of Subscription</SelectItem>
              <SelectItem value="PER_TICKET">Per Ticket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <SupportClauseSummary
        values={{
          warrantyPeriod,
          warrantyUnit: form.watch('warrantyUnit'),
          coverageType: form.watch('coverageType'),
          supportHours: form.watch('supportHours'),
          supportSLA: form.watch('supportSLA'),
          supportCostModel: form.watch('supportCostModel'),
        }}
        title="Proposal Support Clause Preview"
      />
    </div>
  );
}

import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '@/lib/schema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { HardwareBomTable } from '@/components/HardwareBomTable';
import { PaymentModelSelector } from '@/components/PaymentModelSelector';
import type { CloudProvider, CloudCostModel } from '@/types';
import { HardDrive } from 'lucide-react';
import { createEmptyBomLine } from '@/lib/hardwareBom';

interface StepCloudProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function StepCloud({ form }: StepCloudProps) {
  const includesHardware = form.watch('includesHardware');
  const hardwareBom = form.watch('hardwareBom') ?? [];
  const currency = form.watch('currency');

  const toggleHardware = (checked: boolean) => {
    form.setValue('includesHardware', checked, { shouldValidate: true });
    if (checked && hardwareBom.length === 0) {
      form.setValue('hardwareBom', [createEmptyBomLine()], { shouldValidate: true });
    }
    if (!checked) {
      form.setValue('hardwareBom', [], { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Cloud, Contract & Pricing Model</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Choose how the client will pay — the quote will be built for that model only
        </p>
      </div>

      <PaymentModelSelector form={form} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cloud Provider</Label>
          <Select value={form.watch('cloudProvider')} onValueChange={(v) => form.setValue('cloudProvider', v as CloudProvider)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AWS">Amazon Web Services</SelectItem>
              <SelectItem value="AZURE">Microsoft Azure</SelectItem>
              <SelectItem value="GCP">Google Cloud Platform</SelectItem>
              <SelectItem value="NONE">None (On-Premise)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Estimated Monthly Cloud Cost (USD)</Label>
          <Input
            type="number"
            {...form.register('estimatedMonthlyCloudCost')}
            min={0}
            disabled={form.watch('cloudProvider') === 'NONE'}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cloud Cost Model</Label>
          <Select value={form.watch('cloudCostModel')} onValueChange={(v) => form.setValue('cloudCostModel', v as CloudCostModel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixed Monthly</SelectItem>
              <SelectItem value="VARIABLE_BY_VOLUME">Variable by Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Expected Contract Lifetime (months)</Label>
          <Input type="number" {...form.register('expectedLifetime')} min={1} max={60} />
          {form.formState.errors.expectedLifetime && (
            <p className="text-xs text-[var(--color-destructive)]">{form.formState.errors.expectedLifetime.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-[var(--color-border)] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={includesHardware}
            onCheckedChange={(v) => toggleHardware(v === true)}
            className="mt-0.5"
          />
          <div>
            <span className="font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[var(--color-primary)]" />
              Solution includes hardware
            </span>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Build a bill of materials for servers, GPUs, cameras, sensors, PLCs, and other physical components
            </p>
          </div>
        </label>

        {includesHardware && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <HardwareBomTable
              value={hardwareBom}
              currency={currency}
              onChange={(bom) => form.setValue('hardwareBom', bom, { shouldValidate: true })}
              error={form.formState.errors.hardwareBom?.message as string | undefined}
            />
          </div>
        )}
      </div>

      {form.watch('cloudProvider') !== 'NONE' && (
        <Card className="bg-[var(--color-muted)]/30">
          <CardContent className="pt-4 text-sm text-[var(--color-muted-foreground)]">
            Cloud costs are passed through with a 15% management markup, adjusted by problem-type multiplier.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

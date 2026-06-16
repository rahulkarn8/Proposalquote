import { Plus, Trash2 } from 'lucide-react';
import type { HardwareBomLine } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { createEmptyBomLine, sumHardwareBom } from '@/lib/hardwareBom';

interface HardwareBomTableProps {
  value: HardwareBomLine[];
  onChange: (bom: HardwareBomLine[]) => void;
  currency: string;
  error?: string;
}

export function HardwareBomTable({ value, onChange, currency, error }: HardwareBomTableProps) {
  const rows = value.length > 0 ? value : [createEmptyBomLine()];
  const total = sumHardwareBom(rows);

  const updateRow = (index: number, patch: Partial<HardwareBomLine>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => onChange([...rows, createEmptyBomLine()]);

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [createEmptyBomLine()]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Hardware Bill of Materials (BOM)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="w-4 h-4" /> Add line
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-[var(--color-muted)]/40">
              <th className="text-left py-2 px-2 font-medium min-w-[180px]">Item / Description</th>
              <th className="text-left py-2 px-2 font-medium min-w-[100px]">Part #</th>
              <th className="text-right py-2 px-2 font-medium w-20">Qty</th>
              <th className="text-right py-2 px-2 font-medium w-28">Unit ({currency})</th>
              <th className="text-right py-2 px-2 font-medium w-28">Line Total</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const lineTotal = row.quantity * row.unitPrice;
              return (
                <tr key={index} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="p-2">
                    <Input
                      value={row.item}
                      onChange={(e) => updateRow(index, { item: e.target.value })}
                      placeholder="Edge GPU server"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={row.partNumber ?? ''}
                      onChange={(e) => updateRow(index, { partNumber: e.target.value })}
                      placeholder="SKU-001"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={1}
                      className="text-right"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, { quantity: Number(e.target.value) || 1 })}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      className="text-right"
                      value={row.unitPrice}
                      onChange={(e) => updateRow(index, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-2 text-right font-medium whitespace-nowrap">
                    {formatCurrency(lineTotal, currency)}
                  </td>
                  <td className="p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      aria-label="Remove line"
                    >
                      <Trash2 className="w-4 h-4 text-[var(--color-destructive)]" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--color-muted)]/30">
              <td colSpan={4} className="py-2 px-2 text-right font-medium">Hardware subtotal</td>
              <td className="py-2 px-2 text-right font-bold text-[var(--color-primary)]">
                {formatCurrency(total, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {error && (
        <p className="text-xs text-[var(--color-destructive)]">{error}</p>
      )}
      <p className="text-xs text-[var(--color-muted-foreground)]">
        BOM totals are billed upfront with the setup fee (subscription) or included in the one-time payment.
      </p>
    </div>
  );
}

/** Read-only BOM for review / PDF-style display */
export function HardwareBomSummary({
  bom,
  currency,
}: {
  bom: HardwareBomLine[];
  currency: string;
}) {
  if (bom.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-[var(--color-muted)]/40">
            <th className="text-left py-2 px-3">Item</th>
            <th className="text-left py-2 px-3">Part #</th>
            <th className="text-right py-2 px-3">Qty</th>
            <th className="text-right py-2 px-3">Unit</th>
            <th className="text-right py-2 px-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {bom.map((row, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-2 px-3">{row.item}</td>
              <td className="py-2 px-3 text-[var(--color-muted-foreground)]">{row.partNumber || '—'}</td>
              <td className="py-2 px-3 text-right">{row.quantity}</td>
              <td className="py-2 px-3 text-right">{formatCurrency(row.unitPrice, currency)}</td>
              <td className="py-2 px-3 text-right font-medium">
                {formatCurrency(row.quantity * row.unitPrice, currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="py-2 px-3 text-right font-medium">Subtotal</td>
            <td className="py-2 px-3 text-right font-bold">{formatCurrency(sumHardwareBom(bom), currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

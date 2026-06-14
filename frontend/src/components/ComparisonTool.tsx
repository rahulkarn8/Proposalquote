import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { compareScenarios } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { QuoteConfiguration, PricingBreakdown } from '@/types';
import { GitCompare } from 'lucide-react';

interface ComparisonToolProps {
  baseConfig: QuoteConfiguration;
  currency: string;
}

interface ScenarioResult {
  label: string;
  config: QuoteConfiguration;
  pricing: PricingBreakdown;
}

export function ComparisonTool({ baseConfig, currency }: ComparisonToolProps) {
  const [results, setResults] = useState<ScenarioResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    setLoading(true);
    try {
      const data = await compareScenarios(baseConfig, [
        {
          label: 'Lower Complexity',
          overrides: { complexity: 'LOW', engineeringEffort: Math.max(20, baseConfig.engineeringEffort * 0.7) },
        },
        {
          label: 'Higher Volume',
          overrides: { volume: baseConfig.volume * 2, complexity: 'HIGH' },
        },
        {
          label: 'Premium Support',
          overrides: { supportHours: '24x7', supportSLA: '4HR', warrantyPeriod: 12, warrantyUnit: 'months' },
        },
      ]);
      setResults([{ label: 'Current', config: data.base.config, pricing: data.base.pricing }, ...data.scenarios]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="w-4 h-4" />
          Scenario Comparison
        </CardTitle>
        <Button size="sm" variant="outline" onClick={runComparison} disabled={loading}>
          {loading ? 'Comparing...' : 'Compare Scenarios'}
        </Button>
      </CardHeader>
      {results && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Scenario</th>
                  <th className="text-right py-2">Setup</th>
                  <th className="text-right py-2">MRR</th>
                  <th className="text-right py-2">Year 1</th>
                  <th className="text-right py-2">TCV</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.label} className="border-b border-[var(--color-border)]">
                    <td className="py-2 font-medium">{r.label}</td>
                    <td className="text-right py-2">{formatCurrency(r.pricing.setupFee, currency)}</td>
                    <td className="text-right py-2">{formatCurrency(r.pricing.monthlyFee, currency)}</td>
                    <td className="text-right py-2">{formatCurrency(r.pricing.year1Cost, currency)}</td>
                    <td className="text-right py-2 font-semibold">{formatCurrency(r.pricing.totalContractValue, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

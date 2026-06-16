import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import {
  getAdminSettings, saveAdminSettings, getAnalytics,
  addProblemType, deleteProblemType, seedSampleData, resetAdminSettings,
  getSolutionFeatures,
} from '@/lib/api';
import type { AdminSettings, QuoteAnalytics, Complexity, SolutionFeature } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings, BarChart3, DollarSign, Layers, Headphones, Plus, Trash2,
  ArrowLeft, Save, RefreshCw, Database, AlertTriangle,
} from 'lucide-react';

type Tab = 'setup-fee' | 'coverage' | 'support' | 'problem-types' | 'general' | 'analytics';

const UNLIMITED_VOLUME = 999_999_999;

export function AdminPanel() {
  const messageRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('analytics');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [featureCatalog, setFeatureCatalog] = useState<SolutionFeature[]>([]);
  const [featureCategories, setFeatureCategories] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<QuoteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);

  const showMessage = (text: string, isError = false) => {
    setMessage(text);
    setMessageIsError(isError);
    requestAnimationFrame(() => {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const [newType, setNewType] = useState({
    type: '', label: '', description: '', volumeUnit: 'documents/month', perUnitProcessingRate: 0.05,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a, features] = await Promise.all([
        getAdminSettings(),
        getAnalytics(),
        getSolutionFeatures(),
      ]);
      setSettings(s);
      setAnalytics(a);
      setFeatureCatalog(features.features);
      setFeatureCategories(features.categories);
    } catch (err) {
      showMessage(`Error loading: ${err instanceof Error ? err.message : 'Unknown'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: AdminSettings = {
        ...settings,
        volumeTiers: settings.volumeTiers.map((tier) => ({
          ...tier,
          maxVolume:
            tier.maxVolume == null ||
            tier.maxVolume === Infinity ||
            !Number.isFinite(tier.maxVolume) ||
            tier.requiresCustomPricing
              ? UNLIMITED_VOLUME
              : tier.maxVolume,
        })),
      };
      const saved = await saveAdminSettings(payload);
      setSettings(saved);
      showMessage('Settings saved successfully');
    } catch (err) {
      showMessage(`Save failed: ${err instanceof Error ? err.message : 'Unknown'}`, true);
    } finally {
      setSaving(false);
    }
  };

  const handleAddProblemType = async () => {
    try {
      await addProblemType({
        ...newType,
        type: newType.type.toUpperCase().replace(/\s+/g, '_'),
      });
      setNewType({ type: '', label: '', description: '', volumeUnit: 'documents/month', perUnitProcessingRate: 0.05 });
      const s = await getAdminSettings();
      setSettings(s);
      setMessage('Problem type added');
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleDeleteProblemType = async (type: string) => {
    try {
      await deleteProblemType(type);
      const s = await getAdminSettings();
      setSettings(s);
      setMessage(`Deleted ${type}`);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleSeed = async () => {
    try {
      const result = await seedSampleData();
      setMessage(`Seeded ${result.created} sample quotes`);
      const a = await getAnalytics();
      setAnalytics(a);
    } catch (err) {
      setMessage(`Seed failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults?')) return;
    try {
      const s = await resetAdminSettings();
      setSettings(s);
      setMessage('Settings reset to defaults');
    } catch (err) {
      setMessage(`Reset failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  const updateRate = (complexity: Complexity, value: number) => {
    if (!settings) return;
    setSettings({ ...settings, hourlyRates: { ...settings.hourlyRates, [complexity]: value } });
  };

  const updateCoverageMultiplier = (key: string, value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      coverageMultipliers: { ...settings.coverageMultipliers, [key]: value },
    });
  };

  const updateSupport = (field: string, value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      supportTierPricing: { ...settings.supportTierPricing, [field]: value },
    });
  };

  const updateSetupFee = <K extends keyof AdminSettings['setupFeeConfig']>(
    field: K,
    value: AdminSettings['setupFeeConfig'][K]
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      setupFeeConfig: { ...settings.setupFeeConfig, [field]: value },
    });
  };

  const updateIntegrationMultiplier = (level: 'LOW' | 'MEDIUM' | 'HIGH', value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      setupFeeConfig: {
        ...settings.setupFeeConfig,
        integrationMultipliers: {
          ...settings.setupFeeConfig.integrationMultipliers,
          [level]: value,
        },
      },
    });
  };

  const updateComplianceMultiplier = (key: string, value: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      setupFeeConfig: {
        ...settings.setupFeeConfig,
        complianceMultipliers: {
          ...settings.setupFeeConfig.complianceMultipliers,
          [key]: value,
        },
      },
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'setup-fee', label: 'Setup Fee', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'coverage', label: 'Coverage', icon: <Layers className="w-4 h-4" /> },
    { id: 'support', label: 'Support', icon: <Headphones className="w-4 h-4" /> },
    { id: 'problem-types', label: 'Problem Types', icon: <Plus className="w-4 h-4" /> },
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  ];

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-muted-foreground)]">Loading admin panel...</div>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <AppHeader subtitle="Admin Configuration">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" /> Back to Quotes
            </Button>
          </Link>
        </div>
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab(t.id)}
              className="gap-1"
            >
              {t.icon} {t.label}
            </Button>
          ))}
        </div>

        {message && (
          <div
            ref={messageRef}
            className={`mb-4 p-3 rounded-md text-sm border ${
              messageIsError
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            {message}
          </div>
        )}

        {tab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Total Quotes</p>
                  <p className="text-2xl font-bold">{analytics.totalQuotes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue, 'USD')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Average TCV</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.averageTCV, 'USD')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-[var(--color-muted-foreground)]">Status</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{analytics.finalQuotes} Final</Badge>
                    <Badge variant="secondary">{analytics.draftQuotes} Draft</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">By Problem Type</CardTitle></CardHeader>
                <CardContent>
                  {Object.entries(analytics.quotesByProblemType).map(([type, count]) => (
                    <div key={type} className="flex justify-between py-1 text-sm">
                      <span>{type.replace(/_/g, ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(analytics.quotesByProblemType).length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">No quotes yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">By Currency</CardTitle></CardHeader>
                <CardContent>
                  {Object.entries(analytics.quotesByCurrency).map(([cur, count]) => (
                    <div key={cur} className="flex justify-between py-1 text-sm">
                      <span>{cur}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Quotes</CardTitle>
                <Button size="sm" variant="outline" onClick={handleSeed}>
                  <Database className="w-4 h-4" /> Seed Sample Data
                </Button>
              </CardHeader>
              <CardContent>
                {analytics.recentQuotes.length === 0 ? (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    No quotes yet. Click "Seed Sample Data" to create 3 demo quotes.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Quote #</th>
                          <th className="text-left py-2">Type</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-right py-2">TCV</th>
                          <th className="text-right py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentQuotes.map((q) => (
                          <tr key={q.id} className="border-b border-[var(--color-border)]">
                            <td className="py-2 font-medium">{q.quoteNumber}</td>
                            <td className="py-2">{q.problemType.replace(/_/g, ' ')}</td>
                            <td className="py-2"><Badge variant={q.status === 'FINAL' ? 'default' : 'secondary'}>{q.status}</Badge></td>
                            <td className="text-right py-2">{formatCurrency(q.totalPrice, q.currency)}</td>
                            <td className="text-right py-2">{formatDate(q.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'setup-fee' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Setup Fee Formula</CardTitle>
                <CardDescription>
                  Setup Fee = Engineering Hours × Hourly Rate × Problem Complexity × Coverage × Integration × Compliance × Global Multiplier
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-[var(--color-muted-foreground)] space-y-1">
                <p>Engineering hours and complexity come from the quote form.</p>
                <p>Problem complexity factor is set per problem type (Problem Types tab).</p>
                <p>Coverage multipliers are on the Coverage tab.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Engineering Rates</CardTitle>
                <CardDescription>Base rate per complexity level ($/hr)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as Complexity[]).map((c) => (
                  <div key={c} className="space-y-2">
                    <Label>{c} ($/hr)</Label>
                    <Input
                      type="number"
                      value={settings.hourlyRates[c]}
                      onChange={(e) => updateRate(c, Number(e.target.value))}
                      min={0}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Global & Integration Multipliers</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Global Setup Multiplier</Label>
                  <Input
                    type="number"
                    step={0.05}
                    min={0}
                    value={settings.setupFeeConfig.globalMultiplier}
                    onChange={(e) => updateSetupFee('globalMultiplier', Number(e.target.value))}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">Applied to all setup fees (1.0 = no change)</p>
                </div>
                <div className="space-y-2">
                  <Label>Default Custom Coverage %</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={settings.setupFeeConfig.defaultCoverageMultiplier}
                    onChange={(e) => updateSetupFee('defaultCoverageMultiplier', Number(e.target.value))}
                  />
                </div>
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                  <div key={level} className="space-y-2">
                    <Label>Integration — {level}</Label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      value={settings.setupFeeConfig.integrationMultipliers[level]}
                      onChange={(e) => updateIntegrationMultiplier(level, Number(e.target.value))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Multipliers</CardTitle>
                <CardDescription>Added to setup fee when compliance is required</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['GDPR', 'HIPAA', 'SOC2'] as const).map((req) => (
                  <div key={req} className="space-y-2">
                    <Label>{req}</Label>
                    <Input
                      type="number"
                      step={0.01}
                      min={0}
                      max={1}
                      value={settings.setupFeeConfig.complianceMultipliers[req] ?? 0}
                      onChange={(e) => updateComplianceMultiplier(req, Number(e.target.value))}
                    />
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      +{((settings.setupFeeConfig.complianceMultipliers[req] ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Setup-Derived Monthly Fees</CardTitle>
                <CardDescription>Percentages applied from the calculated setup fee</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Maintenance Fee %</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={settings.setupFeeConfig.maintenanceFeePercent}
                    onChange={(e) => updateSetupFee('maintenanceFeePercent', Number(e.target.value))}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">Monthly = setup × % ÷ 12</p>
                </div>
                <div className="space-y-2">
                  <Label>Support % of Setup</Label>
                  <Input
                    type="number"
                    step={0.01}
                    min={0}
                    max={1}
                    value={settings.setupFeeConfig.supportPercentOfSetup}
                    onChange={(e) => updateSetupFee('supportPercentOfSetup', Number(e.target.value))}
                  />
                  <p className="text-xs text-[var(--color-muted-foreground)]">When support model = % of subscription</p>
                </div>
                <div className="space-y-2">
                  <Label>Per-Ticket Support Base ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.setupFeeConfig.perTicketSupportBase}
                    onChange={(e) => updateSetupFee('perTicketSupportBase', Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'coverage' && settings && (
          <Card>
            <CardHeader>
              <CardTitle>Solution Feature Weights</CardTitle>
              <CardDescription>
                Feature weight used in feature-wise setup pricing ({featureCatalog.length} predefined AI features)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {featureCategories.map((category) => {
                const items = featureCatalog.filter((f) => f.category === category);
                if (items.length === 0) return null;
                return (
                  <div key={category} className="space-y-2">
                    <Label className="text-base">{category}</Label>
                    <div className="space-y-2">
                      {items.map((feature) => (
                        <div key={feature.label} className="flex items-start gap-4 p-2 rounded border border-[var(--color-border)]">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{feature.label}</p>
                            {feature.description && (
                              <p className="text-xs text-[var(--color-muted-foreground)]">{feature.description}</p>
                            )}
                          </div>
                          <Input
                            type="number"
                            className="w-24 shrink-0"
                            step={0.01}
                            min={0}
                            max={1}
                            value={settings.coverageMultipliers[feature.label] ?? feature.multiplier}
                            onChange={(e) => updateCoverageMultiplier(feature.label, Number(e.target.value))}
                          />
                          <span className="text-xs text-[var(--color-muted-foreground)] w-12 shrink-0 pt-2">
                            {(((settings.coverageMultipliers[feature.label] ?? feature.multiplier) * 100)).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.entries(settings.coverageMultipliers)
                .filter(([k]) => !featureCatalog.some((f) => f.label === k))
                .map(([key, val]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm flex-1 italic">{key}</span>
                    <Input type="number" className="w-24" step={0.01} value={val}
                      onChange={(e) => updateCoverageMultiplier(key, Number(e.target.value))} />
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {tab === 'support' && settings && (
          <Card>
            <CardHeader><CardTitle>Support Tier Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Base Support Monthly ($)</Label>
                <Input type="number" value={settings.supportTierPricing.baseSupportMonthly}
                  onChange={(e) => updateSupport('baseSupportMonthly', Number(e.target.value))} />
              </div>
              <div>
                <Label className="mb-2 block">SLA Multipliers</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.supportTierPricing.slaMultipliers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-sm w-32">{k}</span>
                      <Input type="number" step={0.1} value={v}
                        onChange={(e) => setSettings({
                          ...settings,
                          supportTierPricing: {
                            ...settings.supportTierPricing,
                            slaMultipliers: { ...settings.supportTierPricing.slaMultipliers, [k]: Number(e.target.value) },
                          },
                        })} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Hours Multipliers</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(settings.supportTierPricing.hoursMultipliers).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-sm w-32">{k}</span>
                      <Input type="number" step={0.1} value={v}
                        onChange={(e) => setSettings({
                          ...settings,
                          supportTierPricing: {
                            ...settings.supportTierPricing,
                            hoursMultipliers: { ...settings.supportTierPricing.hoursMultipliers, [k]: Number(e.target.value) },
                          },
                        })} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'problem-types' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Existing Problem Types</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {settings.problemTypes.map((pt) => (
                  <div key={pt.type} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{pt.label}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{pt.type} — {pt.volumeUnit} @ ${pt.perUnitProcessingRate}/unit</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProblemType(pt.type)}>
                      <Trash2 className="w-4 h-4 text-[var(--color-destructive)]" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add New Problem Type</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type ID (UPPER_SNAKE_CASE)</Label>
                  <Input value={newType.type} onChange={(e) => setNewType({ ...newType, type: e.target.value })} placeholder="SENTIMENT_ANALYSIS" />
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input value={newType.label} onChange={(e) => setNewType({ ...newType, label: e.target.value })} placeholder="Sentiment Analysis" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={newType.description} onChange={(e) => setNewType({ ...newType, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Volume Unit</Label>
                  <Input value={newType.volumeUnit} onChange={(e) => setNewType({ ...newType, volumeUnit: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Per-Unit Rate ($)</Label>
                  <Input type="number" step={0.01} value={newType.perUnitProcessingRate}
                    onChange={(e) => setNewType({ ...newType, perUnitProcessingRate: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={handleAddProblemType} disabled={!newType.type || !newType.label}>
                    <Plus className="w-4 h-4" /> Add Problem Type
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'general' && settings && (
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <Select value={settings.defaultCurrency}
                  onValueChange={(v) => setSettings({ ...settings, defaultCurrency: v as AdminSettings['defaultCurrency'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input type="number" min={0} max={100} step={0.1} value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Cloud Markup (%)</Label>
                <Input type="number" min={0} max={100} step={1}
                  value={Math.round(settings.cloudMarkup * 100)}
                  onChange={(e) => setSettings({ ...settings, cloudMarkup: Number(e.target.value) / 100 })} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Volume Tiers</Label>
                <div className="space-y-2 text-sm">
                  {settings.volumeTiers.map((tier, i) => (
                    <div key={i} className="flex items-center gap-4 p-2 border rounded">
                      <span className="flex-1">{tier.label}</span>
                      <span>Up to {tier.requiresCustomPricing || tier.maxVolume >= UNLIMITED_VOLUME ? '∞' : tier.maxVolume.toLocaleString()}</span>
                      <span>{(tier.discount * 100).toFixed(0)}% off</span>
                      {tier.requiresCustomPricing && (
                        <Badge variant="outline" className="text-amber-600">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Custom
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex gap-2 pt-4">
                <Button variant="destructive" size="sm" onClick={handleReset}>Reset to Defaults</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab !== 'analytics' && (
          <div className="mt-6 sticky bottom-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving || !settings} size="lg">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quoteFormSchema, QuoteFormValues } from '@/lib/schema';
import { DEFAULT_CONFIG } from '@/types';
import { saveQuote, generatePdf, downloadQuotePdf, getProblemTypes } from '@/lib/api';
import { toQuoteConfiguration, normalizeLoadedConfig } from '@/lib/quoteConfig';
import type { ProblemTypeFactors, QuoteConfiguration } from '@/types';
import { useDebouncedPricing } from '@/hooks/useDebouncedPricing';
import { StepIndicator, STEPS } from '@/components/StepIndicator';
import { QuotePreview } from '@/components/QuotePreview';
import { ComparisonTool } from '@/components/ComparisonTool';
import { SavedQuotes } from '@/components/SavedQuotes';
import { StepProblem } from '@/components/steps/StepProblem';
import { StepVolume } from '@/components/steps/StepVolume';
import { StepCoverage } from '@/components/steps/StepCoverage';
import { StepWarranty } from '@/components/steps/StepWarranty';
import { StepCloud } from '@/components/steps/StepCloud';
import { StepReview } from '@/components/steps/StepReview';
import { StepComplete } from '@/components/steps/StepComplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save, FileDown, Mail, Plus, Pencil } from 'lucide-react';

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [problemTypes, setProblemTypes] = useState<ProblemTypeFactors[]>([]);
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [savedQuoteNumber, setSavedQuoteNumber] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [emailOpened, setEmailOpened] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: DEFAULT_CONFIG,
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const { pricing, isInitialLoad, isRefreshing, setPricing } = useDebouncedPricing(form);

  // Only re-render sidebar when these specific fields change
  const currency = useWatch({ control: form.control, name: 'currency' });
  const expectedLifetime = useWatch({ control: form.control, name: 'expectedLifetime' });
  const problemType = useWatch({ control: form.control, name: 'problemType' });
  const clientName = useWatch({ control: form.control, name: 'clientName' });

  const problemTypeLabel = useMemo(
    () => problemTypes.find((p) => p.type === problemType)?.label,
    [problemTypes, problemType]
  );

  useEffect(() => {
    getProblemTypes().then(setProblemTypes).catch(console.error);
  }, []);

  const isCompleteStep = step === STEPS.length - 1;
  const isReviewStep = step === STEPS.length - 2;

  const validateStep = async (): Promise<boolean> => {
    const fieldsByStep: (keyof QuoteFormValues)[][] = [
      ['clientName', 'problemStatement', 'problemType'],
      ['volume', 'volumeUnit', 'complexity', 'engineeringEffort', 'currency', 'startDate'],
      ['solutionCoverage', 'complianceRequirements', 'requiredLanguagesFrameworks', 'integrationComplexity'],
      ['warrantyPeriod', 'warrantyUnit', 'coverageType', 'supportHours', 'supportSLA', 'supportCostModel'],
      ['cloudProvider', 'estimatedMonthlyCloudCost', 'cloudCostModel', 'expectedLifetime', 'paymentModel'],
      [],
      [],
    ];

    const fields = fieldsByStep[step];
    if (fields.length === 0) return true;
    return form.trigger(fields);
  };

  const nextStep = async () => {
    const valid = await validateStep();
    if (valid && step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinalize = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const valid = await form.trigger();
      if (!valid) {
        setMessage('Please fix validation errors before finalizing.');
        return;
      }

      const config = toQuoteConfiguration(form.getValues());
      const result = await saveQuote(config, 'FINAL');
      setSavedQuoteId(result.id);
      setSavedQuoteNumber(result.quoteNumber);
      setPricing(result.pricing);
      setPdfDownloaded(false);
      setEmailOpened(false);
      setStep(STEPS.length - 1);
    } catch (err) {
      setMessage(`Finalize failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const config = toQuoteConfiguration(form.getValues());
      const result = await saveQuote(config, 'DRAFT');
      setSavedQuoteId(result.id);
      setSavedQuoteNumber(result.quoteNumber);
      setPricing(result.pricing);
      setMessage(`Draft saved: ${result.quoteNumber}`);
    } catch (err) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    setMessage(null);
    try {
      const valid = await form.trigger();
      if (!valid) {
        setMessage('Please complete all required fields before generating the PDF.');
        return;
      }

      let id = savedQuoteId;
      let quoteNumber = savedQuoteNumber;
      if (!id) {
        const config = toQuoteConfiguration(form.getValues());
        const result = await saveQuote(config, 'FINAL');
        id = result.id;
        quoteNumber = result.quoteNumber;
        setSavedQuoteId(id);
        setSavedQuoteNumber(quoteNumber);
        setPricing(result.pricing);
        setStep(STEPS.length - 1);
      }

      await generatePdf(id);
      await downloadQuotePdf(id, quoteNumber ?? 'proposal');
      setPdfDownloaded(true);
      setMessage(`PDF downloaded: ${quoteNumber ?? 'proposal'}.pdf`);
    } catch (err) {
      setMessage(`PDF failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleEmailQuote = () => {
    const option = pricing?.paymentOption;
    const subject = encodeURIComponent(`AI Solution Proposal - ${savedQuoteNumber || 'Draft'}`);
    const pricingLine = option?.type === 'ONE_TIME'
      ? `One-Time Payment: ${option.upfrontPayment}`
      : `Monthly Subscription: ${option?.upfrontPayment ?? pricing?.setupFee} setup + ${option?.recurringPayment ?? pricing?.monthlyFee}/mo`;
    const body = encodeURIComponent(
      `Please find attached our AI solution proposal.\n\n` +
      `${pricingLine}\n` +
      `Total Contract Value: ${pricing?.totalContractValue}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setEmailOpened(true);
  };

  const handleStartNewQuote = () => {
    form.reset(DEFAULT_CONFIG);
    setSavedQuoteId(null);
    setSavedQuoteNumber(null);
    setPdfDownloaded(false);
    setEmailOpened(false);
    setStep(0);
    setMessage(null);
  };

  const handleLoadQuote = (
    config: QuoteConfiguration,
    quoteId: string,
    meta?: { quoteNumber?: string; status?: string }
  ) => {
    form.reset(normalizeLoadedConfig(config));
    setSavedQuoteId(quoteId);
    setSavedQuoteNumber(meta?.quoteNumber ?? null);
    setPdfDownloaded(false);
    setEmailOpened(false);
    setStep(meta?.status === 'FINAL' ? STEPS.length - 1 : 0);
    setMessage(meta?.status === 'FINAL' ? `Loaded finalized quote ${meta.quoteNumber}` : 'Quote loaded');
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepProblem form={form} problemTypes={problemTypes} />;
      case 1: return <StepVolume form={form} />;
      case 2: return <StepCoverage form={form} />;
      case 3: return <StepWarranty form={form} />;
      case 4: return <StepCloud form={form} />;
      case 5: return <StepReview form={form} pricing={pricing} problemTypeLabel={problemTypeLabel} />;
      case 6: return (
        <StepComplete
          quoteNumber={savedQuoteNumber ?? '—'}
          clientName={clientName}
          pricing={pricing}
          currency={currency}
          pdfDownloaded={pdfDownloaded}
          emailOpened={emailOpened}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <StepIndicator currentStep={step} />

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={(e) => e.preventDefault()}>
              {renderStep()}

              <div className="flex justify-between mt-8 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={step === 0 || isCompleteStep}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <div className="flex flex-wrap gap-2 justify-end">
                  {isCompleteStep ? (
                    <>
                      <Button type="button" variant="outline" onClick={() => setStep(STEPS.length - 2)}>
                        <Pencil className="w-4 h-4" /> Edit Quote
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEmailQuote}
                        disabled={!savedQuoteId}
                      >
                        <Mail className="w-4 h-4" /> Email Proposal
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDownloadPdf}
                        disabled={generatingPdf || saving}
                      >
                        <FileDown className="w-4 h-4" />
                        {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleStartNewQuote}>
                        <Plus className="w-4 h-4" /> New Quote
                      </Button>
                    </>
                  ) : isReviewStep ? (
                    <>
                      <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                        <Save className="w-4 h-4" /> Save Draft
                      </Button>
                      <Button type="button" onClick={handleFinalize} disabled={saving}>
                        <ChevronRight className="w-4 h-4" />
                        {saving ? 'Finalizing...' : 'Finalize & Continue'}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={nextStep}>
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {isReviewStep && (
          <ComparisonTool baseConfig={toQuoteConfiguration(form.getValues())} currency={currency} />
        )}

        {message && (
          <p className="text-sm text-center p-2 rounded-md bg-[var(--color-muted)]">{message}</p>
        )}
      </div>

      <div className="space-y-4">
        <QuotePreview
          pricing={pricing}
          currency={currency}
          contractMonths={expectedLifetime}
          isInitialLoad={isInitialLoad}
          isRefreshing={isRefreshing}
        />
        <SavedQuotes onLoadQuote={handleLoadQuote} />
      </div>
    </div>
  );
}

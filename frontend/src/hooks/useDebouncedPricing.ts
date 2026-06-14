import { useState, useEffect, useRef, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { calculateQuote } from '@/lib/api';
import { toQuoteConfiguration } from '@/lib/quoteConfig';
import type { QuoteConfiguration, PricingBreakdown } from '@/types';
import { QuoteFormValues } from '@/lib/schema';

const DEBOUNCE_MS = 600;

export function useDebouncedPricing(form: UseFormReturn<QuoteFormValues>) {
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasPricingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastConfigRef = useRef<string>('');
  const inFlightRef = useRef(false);

  const fetchPricing = useCallback(async (config: QuoteConfiguration) => {
    const serialized = JSON.stringify(config);
    if (serialized === lastConfigRef.current && hasPricingRef.current) return;
    if (inFlightRef.current && serialized === lastConfigRef.current) return;

    lastConfigRef.current = serialized;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    inFlightRef.current = true;

    if (!hasPricingRef.current) {
      setIsInitialLoad(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const result = await calculateQuote(config);
      if (!controller.signal.aborted) {
        setPricing(result.pricing);
        hasPricingRef.current = true;
      }
    } catch {
      // Keep stale pricing on error
    } finally {
      if (!controller.signal.aborted) {
        setIsInitialLoad(false);
        setIsRefreshing(false);
        inFlightRef.current = false;
      }
    }
  }, []);

  const scheduleFetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchPricing(toQuoteConfiguration(form.getValues()));
    }, DEBOUNCE_MS);
  }, [form, fetchPricing]);

  useEffect(() => {
    scheduleFetch();

    const subscription = form.watch(() => {
      scheduleFetch();
    });

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [form, scheduleFetch]);

  const setPricingDirect = useCallback((next: PricingBreakdown) => {
    setPricing(next);
    hasPricingRef.current = true;
    lastConfigRef.current = JSON.stringify(form.getValues());
    setIsInitialLoad(false);
    setIsRefreshing(false);
  }, [form]);

  return { pricing, isInitialLoad, isRefreshing, setPricing: setPricingDirect };
}

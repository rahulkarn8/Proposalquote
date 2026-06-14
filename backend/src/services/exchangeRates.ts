import { Currency, ExchangeRates } from '../types';

const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
};

let cachedRates: ExchangeRates | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRates;
  }

  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.ok) {
      const data = await response.json() as { rates: Record<string, number> };
      cachedRates = {
        base: 'USD',
        rates: {
          USD: 1,
          EUR: data.rates.EUR ?? FALLBACK_RATES.EUR,
          GBP: data.rates.GBP ?? FALLBACK_RATES.GBP,
          INR: data.rates.INR ?? FALLBACK_RATES.INR,
        },
        lastUpdated: new Date().toISOString(),
      };
      cacheTimestamp = now;
      return cachedRates;
    }
  } catch {
    // Fall through to fallback rates
  }

  cachedRates = {
    base: 'USD',
    rates: FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
  };
  cacheTimestamp = now;
  return cachedRates;
}

export function getFallbackRates(): ExchangeRates {
  return {
    base: 'USD',
    rates: FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
  };
}

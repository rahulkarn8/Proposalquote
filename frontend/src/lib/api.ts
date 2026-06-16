import type {
  QuoteConfiguration,
  PricingBreakdown,
  ProblemTypeFactors,
  QuoteSummary,
  ExchangeRates,
  AdminSettings,
  QuoteAnalytics,
} from '@/types';
import { getAuthHeaders } from '@/lib/auth';
import type { AuthConfig, LoginResponse, AuthUser } from '@/lib/auth';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    const details = Array.isArray(error.details)
      ? error.details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join('; ')
      : null;
    throw new Error(details ? `Validation failed — ${details}` : error.error || error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getAuthConfig(): Promise<AuthConfig> {
  return request('/auth/config');
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: AuthUser }> {
  return request('/auth/me');
}

export async function calculateQuote(config: QuoteConfiguration): Promise<{
  pricing: PricingBreakdown;
  config: QuoteConfiguration;
  exchangeRates: ExchangeRates;
}> {
  return request('/quotes/calculate', { method: 'POST', body: JSON.stringify(config) });
}

export async function compareScenarios(
  base: QuoteConfiguration,
  scenarios: { label: string; overrides: Partial<QuoteConfiguration> }[]
): Promise<{
  base: { config: QuoteConfiguration; pricing: PricingBreakdown };
  scenarios: { label: string; config: QuoteConfiguration; pricing: PricingBreakdown }[];
}> {
  return request('/quotes/compare', { method: 'POST', body: JSON.stringify({ base, scenarios }) });
}

export async function saveQuote(config: QuoteConfiguration, status: 'DRAFT' | 'FINAL' = 'DRAFT') {
  return request<{ id: string; quoteNumber: string; pricing: PricingBreakdown }>('/quotes', {
    method: 'POST',
    body: JSON.stringify({ ...config, status }),
  });
}

export async function getQuote(id: string) {
  return request<{ quote: QuoteSummary & { validUntil: string }; config: QuoteConfiguration; pricing: PricingBreakdown }>(`/quotes/${id}`);
}

export async function listQuotes(): Promise<QuoteSummary[]> {
  return request('/quotes');
}

export function getPdfUrl(id: string): string {
  return `${API_BASE}/quotes/${id}/pdf`;
}

export async function generatePdf(id: string) {
  return request<{ downloadUrl: string }>(`/quotes/${id}/generate-pdf`, { method: 'POST' });
}

export async function downloadQuotePdf(id: string, filename: string): Promise<void> {
  const res = await fetch(getPdfUrl(id), { headers: getAuthHeaders() });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'PDF download failed' }));
    throw new Error(error.error || error.message || `HTTP ${res.status}`);
  }

  const blob = await res.blob();
  if (!blob.size) {
    throw new Error('PDF file is empty');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  return request('/exchange-rates');
}

export async function getProblemTypes(): Promise<ProblemTypeFactors[]> {
  return request('/problem-types');
}

export async function getVolumeUnits(): Promise<string[]> {
  return request('/problem-types/volume-units');
}

export async function getPricingRates(): Promise<{
  hourlyRates: Record<import('@/types').Complexity, number>;
  volumeTiers: { maxVolume: number; discount: number; label: string; requiresCustomPricing?: boolean }[];
  coverageMultipliers: Record<string, number>;
  defaultCoverageMultiplier: number;
}> {
  return request('/pricing/rates');
}

export async function getSolutionFeatures(problemType?: string): Promise<import('@/types').SolutionFeatureCatalogResponse> {
  const query = problemType ? `?problemType=${encodeURIComponent(problemType)}` : '';
  return request(`/solution-features${query}`);
}

export async function getProblemTypeFactors(type: string): Promise<ProblemTypeFactors> {
  const slug = type.toLowerCase().replace(/_/g, '-');
  return request(`/problem-types/${slug}/factors`);
}

// Admin API
export async function getAdminSettings(): Promise<AdminSettings> {
  return request('/admin/settings');
}

export async function saveAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
  return request('/admin/settings', { method: 'PUT', body: JSON.stringify(settings) });
}

export async function addProblemType(data: {
  type: string; label: string; description: string;
  volumeUnit: string; perUnitProcessingRate: number; cloudCostMultiplier?: number;
}): Promise<ProblemTypeFactors> {
  return request('/admin/problem-types', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteProblemType(type: string): Promise<void> {
  await request(`/admin/problem-types/${type}`, { method: 'DELETE' });
}

export async function getAnalytics(): Promise<QuoteAnalytics> {
  return request('/admin/analytics');
}

export async function seedSampleData(): Promise<{ created: number; quotes: { id: string; quoteNumber: string }[] }> {
  return request('/admin/seed', { method: 'POST' });
}

export async function resetAdminSettings(): Promise<AdminSettings> {
  return request('/admin/reset-settings', { method: 'POST' });
}

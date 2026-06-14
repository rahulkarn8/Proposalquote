import { QuoteConfiguration } from '../types';
import { saveQuote } from './quoteService';

const SAMPLE_QUOTES: { config: QuoteConfiguration; status: 'DRAFT' | 'FINAL' }[] = [
  {
    status: 'FINAL',
    config: {
      clientName: 'Global Logistics Corp',
      problemStatement: 'Manual invoice processing causes delays and errors across 5,000 documents per month. We need automated OCR extraction integrated with our ERP to reduce processing time by 80%.',
      problemType: 'OCR_READING',
      volume: 5000,
      volumeUnit: 'documents/month',
      complexity: 'MEDIUM',
      engineeringEffort: 200,
      currency: 'USD',
      startDate: '2026-07-01',
      solutionCoverage: [
        'Data preprocessing & cleaning',
        'Model training & fine-tuning',
        'API endpoint deployment',
        'Web dashboard for monitoring',
      ],
      warrantyPeriod: 12,
      warrantyUnit: 'months',
      coverageType: 'DEFECTS_ONLY',
      supportHours: 'BUSINESS_HOURS',
      supportSLA: 'NEXT_BUSINESS_DAY',
      supportCostModel: 'FIXED_MONTHLY',
      cloudProvider: 'AWS',
      estimatedMonthlyCloudCost: 800,
      cloudCostModel: 'FIXED',
      complianceRequirements: ['GDPR'],
      requiredLanguagesFrameworks: 'Python, TensorFlow, FastAPI, React',
      integrationComplexity: 'MEDIUM',
      expectedLifetime: 24,
      paymentModel: 'MONTHLY_SUBSCRIPTION',
    },
  },
  {
    status: 'FINAL',
    config: {
      clientName: 'Precision Parts Manufacturing',
      problemStatement: 'Visual inspection on the production line misses micro-defects at high throughput. We require real-time AI defect detection on 25,000 images per day with MES integration.',
      problemType: 'DEFECT_DETECTION',
      volume: 25000,
      volumeUnit: 'images/day',
      complexity: 'HIGH',
      engineeringEffort: 480,
      currency: 'USD',
      startDate: '2026-08-15',
      solutionCoverage: [
        'Data preprocessing & cleaning',
        'Model training & fine-tuning',
        'API endpoint deployment',
        'Integration with existing systems',
        'Documentation & training',
      ],
      warrantyPeriod: 6,
      warrantyUnit: 'months',
      coverageType: 'PERFORMANCE_GUARANTEE',
      supportHours: '24x7',
      supportSLA: '4HR',
      supportCostModel: 'FIXED_MONTHLY',
      cloudProvider: 'AZURE',
      estimatedMonthlyCloudCost: 2500,
      cloudCostModel: 'VARIABLE_BY_VOLUME',
      complianceRequirements: ['SOC2'],
      requiredLanguagesFrameworks: 'Python, PyTorch, OpenCV, Kubernetes',
      integrationComplexity: 'HIGH',
      expectedLifetime: 36,
      paymentModel: 'ONE_TIME',
    },
  },
  {
    status: 'DRAFT',
    config: {
      clientName: 'EuroTech Sensors GmbH',
      problemStatement: 'Anomaly detection on sensor streams is currently rule-based and generates false positives. We need ML-based pattern matching for 500 signals per hour.',
      problemType: 'PATTERN_MATCHING',
      volume: 500,
      volumeUnit: 'signals/hour',
      complexity: 'LOW',
      engineeringEffort: 80,
      currency: 'EUR',
      startDate: '2026-09-01',
      solutionCoverage: [
        'API endpoint deployment',
        'Web dashboard for monitoring',
      ],
      warrantyPeriod: 3,
      warrantyUnit: 'months',
      coverageType: 'DEFECTS_ONLY',
      supportHours: 'BUSINESS_HOURS',
      supportSLA: '24HR',
      supportCostModel: 'PER_TICKET',
      cloudProvider: 'GCP',
      estimatedMonthlyCloudCost: 300,
      cloudCostModel: 'FIXED',
      complianceRequirements: ['NONE'],
      requiredLanguagesFrameworks: 'Python, scikit-learn',
      integrationComplexity: 'LOW',
      expectedLifetime: 12,
      paymentModel: 'MONTHLY_SUBSCRIPTION',
    },
  },
];

export async function seedSampleQuotes(): Promise<{ created: number; quotes: { id: string; quoteNumber: string }[] }> {
  const results: { id: string; quoteNumber: string }[] = [];

  for (const sample of SAMPLE_QUOTES) {
    const result = await saveQuote(sample.config, sample.status);
    results.push({ id: result.id, quoteNumber: result.quoteNumber });
  }

  return { created: results.length, quotes: results };
}

import { AdminSettings } from '../types';
import { ALL_DEFAULT_PROBLEM_TYPES } from './problemTypeCatalog';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  hourlyRates: {
    LOW: 50,
    MEDIUM: 100,
    HIGH: 150,
    VERY_HIGH: 250,
  },
  coverageMultipliers: {
    'Data preprocessing & cleaning': 0.08,
    'Model training & fine-tuning': 0.15,
    'API endpoint deployment': 0.10,
    'Web dashboard for monitoring': 0.12,
    'Integration with existing systems': 0.14,
    'Custom UI/UX': 0.10,
    'Documentation & training': 0.06,
    'Source code ownership': 0.20,
  },
  setupFeeConfig: {
    globalMultiplier: 1.0,
    integrationMultipliers: { LOW: 1.0, MEDIUM: 1.5, HIGH: 2.5 },
    complianceMultipliers: { GDPR: 0.05, HIPAA: 0.12, SOC2: 0.08 },
    defaultCoverageMultiplier: 0.05,
    maintenanceFeePercent: 0.08,
    supportPercentOfSetup: 0.03,
    perTicketSupportBase: 250,
  },
  supportTierPricing: {
    baseSupportMonthly: 500,
    slaMultipliers: { '4HR': 2.0, '8HR': 1.5, '24HR': 1.2, 'NEXT_BUSINESS_DAY': 1.0 },
    hoursMultipliers: { BUSINESS_HOURS: 1.0, '24x7': 1.8, CUSTOM: 1.4 },
    tierMultipliers: { Basic: 1.0, Standard: 1.3, Premium: 1.8 },
  },
  problemTypes: ALL_DEFAULT_PROBLEM_TYPES,
  defaultCurrency: 'USD',
  taxRate: 0,
  cloudMarkup: 0.15,
  volumeTiers: [
    { maxVolume: 1000, discount: 0, label: 'Base' },
    { maxVolume: 10000, discount: 0.10, label: '10% discount' },
    { maxVolume: 100000, discount: 0.20, label: '20% discount' },
    { maxVolume: Infinity, discount: 0, label: 'Custom pricing', requiresCustomPricing: true },
  ],
};

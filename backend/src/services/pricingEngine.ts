import {
  QuoteConfiguration,
  PricingBreakdown,
  PricingLineItem,
  QuotePaymentOption,
  PaymentModel,
  Currency,
} from '../types';
import {
  getProblemTypeFactors,
  getHourlyRate,
  getFeatureCoverageSum,
  getIntegrationMultiplier,
  getSupportMultiplier,
  getComplianceMultiplier,
  getBaseSupportMonthly,
  getCloudMarkup,
  getTaxRate,
  getVolumeTier,
  getMaintenanceFeePercent,
  getSupportPercentOfSetup,
  getPerTicketSupportBase,
} from '../data/problemTypes';
import { calculateSetupFee, resolveSetupPricingMode } from '../lib/setupPricing';
import { formatSupportClause } from '../lib/labels';
import { formatBomLineLabel, getEffectiveHardwareBom, sumHardwareBom } from '../lib/hardwareBom';

const QUARTERLY_DISCOUNT = 0.05;
const ANNUAL_DISCOUNT = 0.15;
const EXTENDED_WARRANTY_THRESHOLD_MONTHS = 12;
const EXTENDED_WARRANTY_SURCHARGE = 0.10;

export function calculatePricing(config: QuoteConfiguration): PricingBreakdown {
  const problemFactors = getProblemTypeFactors(config.problemType);
  const hourlyRate = getHourlyRate(config.complexity);
  const complexityMultiplier = problemFactors.baseComplexityFactors[config.complexity];
  const setupPricingMode = resolveSetupPricingMode(config);
  const { setupFee, effectiveEngineeringEffort, lineItems: setupLineItems } = calculateSetupFee(config, problemFactors);
  const coverageMultiplier = setupPricingMode === 'FEATURE_WISE'
    ? getFeatureCoverageSum(config.solutionCoverage)
    : 1;
  const integrationMultiplier = getIntegrationMultiplier(config.integrationComplexity);
  const complianceMultiplier = getComplianceMultiplier(config.complianceRequirements);
  const volumeTier = getVolumeTier(config.volume);

  const cloudMarkup = getCloudMarkup();
  const cloudBase = config.estimatedMonthlyCloudCost * problemFactors.cloudCostMultiplier;
  const cloudCostMonthly = config.cloudProvider === 'NONE'
    ? 0
    : cloudBase * (1 + cloudMarkup);

  const supportMultiplier = getSupportMultiplier(config.supportSLA, config.supportHours);
  const baseSupport = getBaseSupportMonthly();
  let supportCostMonthly = baseSupport * supportMultiplier * problemFactors.supportTiers[1].multiplier;

  if (config.supportCostModel === 'PERCENTAGE_OF_SUBSCRIPTION') {
    supportCostMonthly = setupFee * getSupportPercentOfSetup();
  } else if (config.supportCostModel === 'PER_TICKET') {
    supportCostMonthly = getPerTicketSupportBase() * supportMultiplier;
  }

  const perUnitRate = problemFactors.perUnitProcessingRate * complexityMultiplier;
  let volumeProcessingFee = config.volume * perUnitRate * (1 - volumeTier.discount);

  if (config.cloudCostModel === 'VARIABLE_BY_VOLUME') {
    volumeProcessingFee *= 1.2;
  }

  const maintenanceFeeMonthly = (setupFee * getMaintenanceFeePercent()) / 12;

  const warrantyMonths = config.warrantyUnit === 'months'
    ? config.warrantyPeriod
    : config.warrantyPeriod / 30;

  let warrantySurcharge = 0;
  if (warrantyMonths > EXTENDED_WARRANTY_THRESHOLD_MONTHS) {
    warrantySurcharge = EXTENDED_WARRANTY_SURCHARGE;
  }

  const monthlyFee = (cloudCostMonthly + supportCostMonthly + volumeProcessingFee + maintenanceFeeMonthly)
    * (1 + warrantySurcharge);

  const quarterlyFee = monthlyFee * 3 * (1 - QUARTERLY_DISCOUNT);
  const annualFee = monthlyFee * 12 * (1 - ANNUAL_DISCOUNT);

  const contractMonths = config.expectedLifetime;
  const hardwareBom = getEffectiveHardwareBom(config.includesHardware, config.hardwareBom, config as QuoteConfiguration & { hardwareDescription?: string; hardwareCost?: number });
  const hardwareCost = sumHardwareBom(hardwareBom);
  const year1Cost = setupFee + hardwareCost + monthlyFee * Math.min(12, contractMonths);
  const totalContractValue = setupFee + hardwareCost + monthlyFee * contractMonths;

  const taxRate = getTaxRate();
  const taxAmount = totalContractValue * (taxRate / 100);
  const totalWithTax = totalContractValue + taxAmount;

  const paymentOptions = buildPaymentOptions({
    setupFee,
    hardwareCost,
    monthlyFee,
    contractMonths,
    totalContractValue,
    taxAmount,
    totalWithTax,
    paymentModel: config.paymentModel,
  });
  const paymentOption = paymentOptions[0];

  const lineItems: PricingLineItem[] = [
    ...setupLineItems,
    {
      category: 'Cloud Infrastructure',
      description: `${config.cloudProvider} hosting with ${(cloudMarkup * 100).toFixed(0)}% management markup`,
      quantity: contractMonths,
      unitPrice: cloudCostMonthly,
      total: cloudCostMonthly * contractMonths,
      recurring: true,
      billingPeriod: 'MONTHLY',
    },
    {
      category: 'Support & Maintenance',
      description: formatSupportClause(config.supportHours, config.supportSLA, config.supportCostModel),
      quantity: contractMonths,
      unitPrice: supportCostMonthly + maintenanceFeeMonthly,
      total: (supportCostMonthly + maintenanceFeeMonthly) * contractMonths,
      recurring: true,
      billingPeriod: 'MONTHLY',
    },
    {
      category: 'Volume Processing',
      description: `${config.volume} ${config.volumeUnit} at $${perUnitRate.toFixed(4)}/unit (${volumeTier.label})`,
      quantity: config.volume,
      unitPrice: perUnitRate * (1 - volumeTier.discount),
      total: volumeProcessingFee * contractMonths,
      recurring: true,
      billingPeriod: 'MONTHLY',
    },
  ];

  if (hardwareCost > 0) {
    for (const row of hardwareBom) {
      const lineTotal = row.quantity * row.unitPrice;
      lineItems.push({
        category: 'Hardware',
        description: formatBomLineLabel(row),
        quantity: row.quantity,
        unitPrice: lineTotal / row.quantity,
        total: lineTotal,
        recurring: false,
        billingPeriod: 'ONE_TIME',
      });
    }
  }

  if (taxRate > 0) {
    lineItems.push({
      category: 'Tax',
      description: `${taxRate}% tax on total contract value`,
      quantity: 1,
      unitPrice: taxAmount,
      total: taxAmount,
      recurring: false,
      billingPeriod: 'ONE_TIME',
    });
  }

  return {
    setupFee: round2(setupFee),
    monthlyFee: round2(monthlyFee),
    quarterlyFee: round2(quarterlyFee),
    annualFee: round2(annualFee),
    quarterlyDiscount: QUARTERLY_DISCOUNT,
    annualDiscount: ANNUAL_DISCOUNT,
    year1Cost: round2(year1Cost),
    totalContractValue: round2(totalContractValue),
    taxAmount: round2(taxAmount),
    totalWithTax: round2(totalWithTax),
    paymentModel: config.paymentModel,
    paymentOption,
    paymentOptions,
    lineItems,
    hourlyRate,
    complexityMultiplier,
    integrationMultiplier,
    coverageMultiplier,
    setupPricingMode,
    effectiveEngineeringEffort,
    volumeProcessingFee: round2(volumeProcessingFee),
    cloudCostMonthly: round2(cloudCostMonthly),
    supportCostMonthly: round2(supportCostMonthly),
    maintenanceFeeMonthly: round2(maintenanceFeeMonthly),
    warrantySurcharge,
    volumeDiscount: volumeTier.discount,
    volumeTierLabel: volumeTier.label,
    requiresCustomPricing: volumeTier.requiresCustomPricing,
    hardwareCost: round2(hardwareCost),
    hardwareBom,
  };
}

export function convertCurrency(amount: number, from: Currency, to: Currency, rates: Record<Currency, number>): number {
  if (from === to) return amount;
  const usdAmount = amount / rates[from];
  return round2(usdAmount * rates[to]);
}

export function applyCurrencyToPricing(
  pricing: PricingBreakdown,
  currency: Currency,
  rates: Record<Currency, number>
): PricingBreakdown {
  if (currency === 'USD') return pricing;

  const convert = (n: number) => convertCurrency(n, 'USD', currency, rates);

  return {
    ...pricing,
    setupFee: convert(pricing.setupFee),
    monthlyFee: convert(pricing.monthlyFee),
    quarterlyFee: convert(pricing.quarterlyFee),
    annualFee: convert(pricing.annualFee),
    year1Cost: convert(pricing.year1Cost),
    totalContractValue: convert(pricing.totalContractValue),
    taxAmount: convert(pricing.taxAmount),
    totalWithTax: convert(pricing.totalWithTax),
    volumeProcessingFee: convert(pricing.volumeProcessingFee),
    cloudCostMonthly: convert(pricing.cloudCostMonthly),
    supportCostMonthly: convert(pricing.supportCostMonthly),
    maintenanceFeeMonthly: convert(pricing.maintenanceFeeMonthly),
    hardwareCost: convert(pricing.hardwareCost),
    hardwareBom: pricing.hardwareBom.map((row) => ({
      ...row,
      unitPrice: convert(row.unitPrice),
    })),
    paymentOption: {
      ...pricing.paymentOption,
      upfrontPayment: convert(pricing.paymentOption.upfrontPayment),
      recurringPayment: convert(pricing.paymentOption.recurringPayment),
      totalContractValue: convert(pricing.paymentOption.totalContractValue),
      taxAmount: convert(pricing.paymentOption.taxAmount),
      totalWithTax: convert(pricing.paymentOption.totalWithTax),
    },
    paymentOptions: pricing.paymentOptions.map((option) => ({
      ...option,
      upfrontPayment: convert(option.upfrontPayment),
      recurringPayment: convert(option.recurringPayment),
      totalContractValue: convert(option.totalContractValue),
      taxAmount: convert(option.taxAmount),
      totalWithTax: convert(option.totalWithTax),
    })),
    lineItems: pricing.lineItems.map((item) => ({
      ...item,
      unitPrice: convert(item.unitPrice),
      total: convert(item.total),
    })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function buildPaymentOptions(params: {
  setupFee: number;
  hardwareCost: number;
  monthlyFee: number;
  contractMonths: number;
  totalContractValue: number;
  taxAmount: number;
  totalWithTax: number;
  paymentModel: PaymentModel;
}): QuotePaymentOption[] {
  const {
    setupFee,
    hardwareCost,
    monthlyFee,
    contractMonths,
    totalContractValue,
    taxAmount,
    totalWithTax,
    paymentModel,
  } = params;

  const upfrontAtSigning = round2(setupFee + hardwareCost);
  const hardwareNote = hardwareCost > 0 ? ' Includes one-time hardware costs.' : '';

  const allOptions: QuotePaymentOption[] = [
    {
      type: 'ONE_TIME',
      label: 'One-Time Payment',
      description: `Pay the full contract value in a single upfront payment. No recurring invoices.${hardwareNote}`,
      upfrontPayment: round2(totalContractValue),
      recurringPayment: 0,
      recurringPeriod: null,
      recurringMonths: 0,
      totalContractValue: round2(totalContractValue),
      taxAmount: round2(taxAmount),
      totalWithTax: round2(totalWithTax),
    },
    {
      type: 'MONTHLY_SUBSCRIPTION',
      label: 'Monthly Subscription',
      description: `Pay setup${hardwareCost > 0 ? ', hardware,' : ''} fee upfront, then a fixed monthly subscription for ${contractMonths} months.${hardwareNote}`,
      upfrontPayment: upfrontAtSigning,
      recurringPayment: round2(monthlyFee),
      recurringPeriod: 'MONTHLY',
      recurringMonths: contractMonths,
      totalContractValue: round2(totalContractValue),
      taxAmount: round2(taxAmount),
      totalWithTax: round2(totalWithTax),
    },
  ];

  return allOptions.filter((o) => o.type === paymentModel);
}

export function generateQuoteNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `Q-${date}-${random}`;
}

export function getValidUntilDate(days = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function getTimelineWeeks(config: QuoteConfiguration): { setup: number; rampUp: number; steadyState: number } {
  const effort = resolveSetupPricingMode(config) === 'FEATURE_WISE'
    ? calculateSetupFee(config, getProblemTypeFactors(config.problemType)).effectiveEngineeringEffort
    : (config.engineeringEffortBreakdown?.length
      ? config.engineeringEffortBreakdown.reduce((sum, line) => sum + line.hours, 0)
      : config.engineeringEffort);
  const setup = Math.ceil(effort / 40);
  const rampUp = Math.ceil(config.volume / 1000) + 2;
  const steadyState = config.expectedLifetime;
  return { setup, rampUp, steadyState };
}

export function getExecutiveSummary(config: QuoteConfiguration): string {
  const factors = getProblemTypeFactors(config.problemType);
  const client = config.clientName || 'the client';
  return (
    `Motherson Innovations is pleased to present this proposal to ${client} for an AI-powered ` +
    `${factors.label.toLowerCase()} solution. ${config.problemStatement} ` +
    `Our approach addresses this challenge through a ${config.complexity.toLowerCase().replace('_', ' ')} ` +
    `complexity implementation, designed to process ${config.volume.toLocaleString()} ${config.volumeUnit} ` +
    `with a planned go-live from ${config.startDate}.`
  );
}

export function getTechnicalApproach(config: QuoteConfiguration): string[] {
  const factors = getProblemTypeFactors(config.problemType);
  const paragraphs: string[] = [];

  paragraphs.push(
    `${config.clientName ? `For ${config.clientName}, ` : ''}we propose a ${factors.label.toLowerCase()} solution ` +
    `that directly addresses the challenge described above. ${factors.description}`
  );

  const pricingMode = resolveSetupPricingMode(config);
  const coverageList = pricingMode === 'FEATURE_WISE'
    ? config.solutionCoverage.join(', ')
    : (config.engineeringEffortBreakdown ?? [])
        .filter((line) => line.hours > 0)
        .map((line) => `${line.item} (${line.hours}h)`)
        .join(', ');
  const pricingModeNote = pricingMode === 'FEATURE_WISE'
    ? `Setup is priced feature-by-feature across selected scope items.`
    : `The engineering team will dedicate ${config.engineeringEffort} hours at ${config.complexity.toLowerCase().replace('_', ' ')} complexity.`;
  paragraphs.push(
    `Our delivery scope includes ${coverageList || 'the agreed engineering workstreams'}. ${pricingModeNote} ` +
    `Integration complexity is ${config.integrationComplexity.toLowerCase()} into your existing environment. ` +
    `${config.requiredLanguagesFrameworks ? `Recommended technology stack: ${config.requiredLanguagesFrameworks}.` : ''}`
  );

  paragraphs.push(
    `Infrastructure will be deployed on ${config.cloudProvider !== 'NONE' ? config.cloudProvider : 'on-premise'} ` +
    `with ${config.cloudCostModel === 'VARIABLE_BY_VOLUME' ? 'volume-scaled' : 'fixed'} cloud cost modelling. ` +
    `Upon go-live, ${config.clientName || 'the client'} receives ${config.warrantyPeriod} ${config.warrantyUnit} of ` +
    `${config.coverageType.toLowerCase().replace(/_/g, ' ')} warranty, ${config.supportHours.toLowerCase().replace(/_/g, ' ')} ` +
    `support with ${config.supportSLA} SLA, and ${config.complianceRequirements.filter((c) => c !== 'NONE').join(', ') || 'standard'} compliance built in.`
  );

  return paragraphs;
}

export function getScopeDeliverables(config: QuoteConfiguration): string[] {
  const hardwareBom = getEffectiveHardwareBom(config.includesHardware, config.hardwareBom, config as QuoteConfiguration & { hardwareDescription?: string; hardwareCost?: number });
  const pricingMode = resolveSetupPricingMode(config);
  const scopeItems = pricingMode === 'FEATURE_WISE'
    ? config.solutionCoverage.map((item) => `Delivery of ${item}`)
    : (config.engineeringEffortBreakdown ?? [])
        .filter((line) => line.hours > 0)
        .map((line) => `${line.item} (${line.hours} engineering hours)`);
  const deliverables = [
    ...scopeItems,
    `Integration with existing systems (${config.integrationComplexity.toLowerCase()} complexity)`,
    `Production deployment targeting ${config.volume.toLocaleString()} ${config.volumeUnit}`,
    `Documentation, knowledge transfer, and handover`,
  ];
  if (config.requiredLanguagesFrameworks) {
    deliverables.push(`Implementation using ${config.requiredLanguagesFrameworks}`);
  }
  if (config.includesHardware && hardwareBom.length > 0) {
    deliverables.push(`Hardware supply & installation (${hardwareBom.length} BOM line${hardwareBom.length > 1 ? 's' : ''})`);
  }
  return deliverables;
}

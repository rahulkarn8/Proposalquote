import { PrismaClient } from '@prisma/client';
import { QuoteConfiguration, PricingBreakdown } from '../types';
import type { AuthUser } from '../types/auth';
import {
  calculatePricing,
  applyCurrencyToPricing,
  generateQuoteNumber,
  getValidUntilDate,
} from '../services/pricingEngine';
import { getExchangeRates } from '../services/exchangeRates';

const prisma = new PrismaClient();

function canAccessQuote(quote: { userId: string | null }, user: AuthUser): boolean {
  if (user.role === 'ADMIN') return true;
  if (!quote.userId) return true;
  return quote.userId === user.id;
}

export async function saveQuote(
  config: QuoteConfiguration,
  status: 'DRAFT' | 'FINAL' = 'DRAFT',
  userId?: string
): Promise<{ id: string; quoteNumber: string; pricing: PricingBreakdown }> {
  const rates = await getExchangeRates();
  let pricing = calculatePricing(config);
  pricing = applyCurrencyToPricing(pricing, config.currency, rates.rates);

  const quoteNumber = generateQuoteNumber();
  const validUntil = getValidUntilDate(30);

  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      status,
      userId,
      totalPrice: pricing.totalContractValue,
      currency: config.currency,
      validUntil,
      lineItems: {
        create: pricing.lineItems.map((item) => ({
          category: item.category,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          recurring: item.recurring,
          billingPeriod: item.billingPeriod,
        })),
      },
      configuration: {
        create: {
          data: JSON.stringify(config),
        },
      },
    },
    include: {
      lineItems: true,
      configuration: true,
    },
  });

  return { id: quote.id, quoteNumber: quote.quoteNumber, pricing };
}

export async function getQuoteById(id: string, user?: AuthUser) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      lineItems: true,
      configuration: true,
    },
  });

  if (!quote) return null;
  if (user && !canAccessQuote(quote, user)) return null;

  const config = JSON.parse(quote.configuration!.data) as QuoteConfiguration;
  const rates = await getExchangeRates();
  let pricing = calculatePricing(config);
  pricing = applyCurrencyToPricing(pricing, config.currency, rates.rates);

  return { quote, config, pricing };
}

export async function listQuotes(user?: AuthUser) {
  return prisma.quote.findMany({
    where: user && user.role !== 'ADMIN' ? { userId: user.id } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      quoteNumber: true,
      status: true,
      totalPrice: true,
      currency: true,
      validUntil: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateQuoteStatus(id: string, status: 'DRAFT' | 'FINAL' | 'EXPIRED') {
  return prisma.quote.update({
    where: { id },
    data: { status },
  });
}

export { prisma };

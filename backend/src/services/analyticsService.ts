import { prisma } from './quoteService';
import { QuoteAnalytics, QuoteConfiguration } from '../types';

export async function getQuoteAnalytics(): Promise<QuoteAnalytics> {
  const quotes = await prisma.quote.findMany({
    include: { configuration: true },
    orderBy: { createdAt: 'desc' },
  });

  const draftQuotes = quotes.filter((q) => q.status === 'DRAFT').length;
  const finalQuotes = quotes.filter((q) => q.status === 'FINAL').length;
  const expiredQuotes = quotes.filter((q) => q.status === 'EXPIRED').length;
  const totalRevenue = quotes.reduce((sum, q) => sum + q.totalPrice, 0);
  const averageTCV = quotes.length > 0 ? totalRevenue / quotes.length : 0;

  const quotesByProblemType: Record<string, number> = {};
  const quotesByCurrency: Record<string, number> = {};
  const monthMap: Record<string, { count: number; revenue: number }> = {};

  for (const quote of quotes) {
    quotesByCurrency[quote.currency] = (quotesByCurrency[quote.currency] ?? 0) + 1;

    let problemType = 'Unknown';
    if (quote.configuration) {
      try {
        const config = JSON.parse(quote.configuration.data) as QuoteConfiguration;
        problemType = config.problemType;
      } catch { /* ignore */ }
    }
    quotesByProblemType[problemType] = (quotesByProblemType[problemType] ?? 0) + 1;

    const month = quote.createdAt.toISOString().slice(0, 7);
    if (!monthMap[month]) monthMap[month] = { count: 0, revenue: 0 };
    monthMap[month].count++;
    monthMap[month].revenue += quote.totalPrice;
  }

  const quotesByMonth = Object.entries(monthMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const recentQuotes = quotes.slice(0, 10).map((q) => {
    let problemType = 'Unknown';
    if (q.configuration) {
      try {
        const config = JSON.parse(q.configuration.data) as QuoteConfiguration;
        problemType = config.problemType;
      } catch { /* ignore */ }
    }
    return {
      id: q.id,
      quoteNumber: q.quoteNumber,
      status: q.status,
      totalPrice: q.totalPrice,
      currency: q.currency,
      problemType,
      createdAt: q.createdAt.toISOString(),
    };
  });

  return {
    totalQuotes: quotes.length,
    draftQuotes,
    finalQuotes,
    expiredQuotes,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageTCV: Math.round(averageTCV * 100) / 100,
    quotesByProblemType,
    quotesByCurrency,
    quotesByMonth,
    recentQuotes,
  };
}

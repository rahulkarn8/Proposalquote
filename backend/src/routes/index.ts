import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import fs from 'fs';
import {
  calculateQuoteSchema,
  createQuoteSchema,
  compareScenariosSchema,
} from '../validation/schemas';
import { calculatePricing, applyCurrencyToPricing } from '../services/pricingEngine';
import { getExchangeRates } from '../services/exchangeRates';
import { saveQuote, getQuoteById, listQuotes } from '../services/quoteService';
import { generateProposalPdf, getPdfPath } from '../services/pdfGenerator';
import { getProblemTypeFactors, getAllProblemTypes } from '../data/problemTypes';
import { VOLUME_UNITS } from '../config/problemTypeCatalog';
import {
  ALL_SOLUTION_FEATURES,
  getCategoryOrder,
  getRecommendedFeatures,
} from '../config/solutionFeatureCatalog';
import { getAdminSettings } from '../services/adminConfig';
import { ProblemType } from '../types';

function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}

export const quotesRouter = Router();

quotesRouter.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = calculateQuoteSchema.parse(req.body);
    const rates = await getExchangeRates();
    let pricing = calculatePricing(config);
    pricing = applyCurrencyToPricing(pricing, config.currency, rates.rates);
    res.json({ pricing, config, exchangeRates: rates });
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { base, scenarios } = compareScenariosSchema.parse(req.body);
    const rates = await getExchangeRates();

    const basePricing = applyCurrencyToPricing(
      calculatePricing(base),
      base.currency,
      rates.rates
    );

    const scenarioResults = scenarios.map((scenario) => {
      const merged = { ...base, ...scenario.overrides };
      const pricing = applyCurrencyToPricing(
        calculatePricing(merged),
        merged.currency,
        rates.rates
      );
      return { label: scenario.label, config: merged, pricing };
    });

    res.json({ base: { config: base, pricing: basePricing }, scenarios: scenarioResults });
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = createQuoteSchema.parse(req.body);
    const { status, ...config } = input;
    const result = await saveQuote(config, status, req.user?.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

quotesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = await listQuotes(req.user);
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

quotesRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getQuoteById(param(req, 'id'), req.user);
    if (!result) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

quotesRouter.post('/:id/generate-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getQuoteById(param(req, 'id'), req.user);
    if (!result) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const filePath = await generateProposalPdf({
      quoteNumber: result.quote.quoteNumber,
      createdAt: result.quote.createdAt,
      validUntil: result.quote.validUntil,
      config: result.config,
      pricing: result.pricing,
      currency: result.quote.currency,
    });

    res.json({
      downloadUrl: `/api/quotes/${param(req, 'id')}/pdf`,
      filePath,
    });
  } catch (error) {
    next(error);
  }
});

quotesRouter.get('/:id/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getQuoteById(param(req, 'id'), req.user);
    if (!result) {
      res.status(404).json({ error: 'Quote not found' });
      return;
    }

    const pdfPath = getPdfPath(result.quote.quoteNumber);

    if (!fs.existsSync(pdfPath)) {
      await generateProposalPdf({
        quoteNumber: result.quote.quoteNumber,
        createdAt: result.quote.createdAt,
        validUntil: result.quote.validUntil,
        config: result.config,
        pricing: result.pricing,
        currency: result.quote.currency,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.quote.quoteNumber}.pdf"`
    );
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error) {
    next(error);
  }
});

export const exchangeRouter = Router();

exchangeRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await getExchangeRates();
    res.json(rates);
  } catch (error) {
    next(error);
  }
});

export const problemTypesRouter = Router();

problemTypesRouter.get('/', (_req: Request, res: Response) => {
  res.json(getAllProblemTypes());
});

problemTypesRouter.get('/volume-units', (_req: Request, res: Response) => {
  res.json(VOLUME_UNITS);
});

problemTypesRouter.get('/:type/factors', (req: Request, res: Response) => {
  const type = param(req, 'type').toUpperCase().replace(/-/g, '_') as ProblemType;
  try {
    const factors = getProblemTypeFactors(type);
    res.json(factors);
  } catch {
    res.status(404).json({ error: `Problem type '${req.params.type}' not found` });
  }
});

export const pricingRouter = Router();

pricingRouter.get('/rates', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { loadAdminSettings } = await import('../services/adminConfig');
    await loadAdminSettings();
    const settings = getAdminSettings();
    res.json({
      hourlyRates: settings.hourlyRates,
      volumeTiers: settings.volumeTiers,
      coverageMultipliers: settings.coverageMultipliers,
      defaultCoverageMultiplier: settings.setupFeeConfig.defaultCoverageMultiplier,
    });
  } catch (error) {
    next(error);
  }
});

export const solutionFeaturesRouter = Router();

solutionFeaturesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loadAdminSettings } = await import('../services/adminConfig');
    await loadAdminSettings();
    const settings = getAdminSettings();
    const problemType = typeof req.query.problemType === 'string' ? req.query.problemType : '';

    const features = ALL_SOLUTION_FEATURES.map((f) => ({
      label: f.label,
      category: f.category,
      description: f.description,
      multiplier: settings.coverageMultipliers[f.label] ?? f.defaultMultiplier,
      recommended: problemType ? (f.problemTypes?.includes(problemType) ?? false) : false,
    }));

    const recommended = problemType
      ? getRecommendedFeatures(problemType).map((f) => ({
          label: f.label,
          category: f.category,
          description: f.description,
          multiplier: settings.coverageMultipliers[f.label] ?? f.defaultMultiplier,
          recommended: true,
        }))
      : [];

    res.json({
      features,
      categories: getCategoryOrder(),
      recommended,
    });
  } catch (error) {
    next(error);
  }
});

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
}

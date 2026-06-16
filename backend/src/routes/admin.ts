import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { adminSettingsSchema, newProblemTypeSchema } from '../validation/schemas';
import { loadAdminSettings, saveAdminSettings, normalizeAdminSettings } from '../services/adminConfig';
import { getQuoteAnalytics } from '../services/analyticsService';
import { seedSampleQuotes } from '../services/seedService';
import { AdminSettings, ProblemTypeFactors } from '../types';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole('ADMIN'));

adminRouter.get('/settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await loadAdminSettings();
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

adminRouter.put('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = adminSettingsSchema.parse(normalizeAdminSettings(req.body)) as AdminSettings;
    const saved = await saveAdminSettings(settings);
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/problem-types', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = newProblemTypeSchema.parse(req.body);
    const settings = await loadAdminSettings();

    if (settings.problemTypes.some((p) => p.type === input.type)) {
      res.status(409).json({ error: `Problem type ${input.type} already exists` });
      return;
    }

    const newType: ProblemTypeFactors = {
      type: input.type,
      label: input.label,
      description: input.description,
      baseComplexityFactors: { LOW: 1.0, MEDIUM: 1.5, HIGH: 2.0, VERY_HIGH: 2.5 },
      engineeringEffortRange: { min: 40, max: 1000, typical: 200 },
      cloudCostMultiplier: input.cloudCostMultiplier,
      supportTiers: [
        { tier: 'Basic', multiplier: 1.0 },
        { tier: 'Standard', multiplier: 1.3 },
        { tier: 'Premium', multiplier: 1.8 },
      ],
      volumeUnit: input.volumeUnit as ProblemTypeFactors['volumeUnit'],
      perUnitProcessingRate: input.perUnitProcessingRate,
    };

    settings.problemTypes.push(newType);
    await saveAdminSettings(settings);
    res.status(201).json(newType);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/problem-types/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = Array.isArray(req.params.type) ? req.params.type[0] : req.params.type;
    const settings = await loadAdminSettings();
    const before = settings.problemTypes.length;
    settings.problemTypes = settings.problemTypes.filter((p) => p.type !== type);

    if (settings.problemTypes.length === before) {
      res.status(404).json({ error: 'Problem type not found' });
      return;
    }

    await saveAdminSettings(settings);
    res.json({ deleted: type });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await getQuoteAnalytics();
    res.json(analytics);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/seed', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await seedSampleQuotes();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/reset-settings', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { DEFAULT_ADMIN_SETTINGS } = await import('../config/defaults');
    const saved = await saveAdminSettings(DEFAULT_ADMIN_SETTINGS);
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

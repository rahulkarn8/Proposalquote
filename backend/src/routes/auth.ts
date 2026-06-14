import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAuthConfigPublic, login } from '../services/auth/authService';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.get('/config', async (_req: Request, res: Response) => {
  res.json(await getAuthConfigPublic());
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid login payload' });
      return;
    }
    res.status(401).json({
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true });
});

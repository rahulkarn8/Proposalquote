import { Request, Response, NextFunction } from 'express';
import { resolveUserFromToken } from '../services/auth/authService';
import type { UserRole } from '../types/auth';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const idToken = req.header('X-Cognito-Id-Token');
  const user = await resolveUserFromToken(req.header('Authorization'), idToken);

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

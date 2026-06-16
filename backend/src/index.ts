import express from 'express';
import cors from 'cors';
import {
  quotesRouter,
  exchangeRouter,
  problemTypesRouter,
  pricingRouter,
  solutionFeaturesRouter,
  engineeringEffortsRouter,
  errorHandler,
} from './routes';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { initAdminConfig } from './services/adminConfig';
import { initAuth } from './services/auth/authService';
import { requireAuth } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/quotes', requireAuth, quotesRouter);
app.use('/api/exchange-rates', requireAuth, exchangeRouter);
app.use('/api/problem-types', requireAuth, problemTypesRouter);
app.use('/api/pricing', requireAuth, pricingRouter);
app.use('/api/solution-features', requireAuth, solutionFeaturesRouter);
app.use('/api/engineering-efforts', requireAuth, engineeringEffortsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

Promise.all([initAdminConfig(), initAuth()]).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AI Quote Generator API running on http://localhost:${PORT}`);
  });
});

export default app;

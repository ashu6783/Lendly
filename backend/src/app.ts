import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { notFound, errorHandler } from './middleware/error';

import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import fileRoutes from './routes/file.routes';
import {
  salesRouter,
  sanctionRouter,
  disbursementRouter,
  collectionRouter,
} from './routes/dashboard.routes';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/sales', salesRouter);
  app.use('/api/sanction', sanctionRouter);
  app.use('/api/disbursement', disbursementRouter);
  app.use('/api/collection', collectionRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

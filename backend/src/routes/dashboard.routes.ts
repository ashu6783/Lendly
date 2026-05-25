import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '../types';

import { getLeads } from '../controllers/salesController';
import { getApplied, approve, reject } from '../controllers/sanctionController';
import { getSanctioned, disburse } from '../controllers/disbursementController';
import {
  getCollectible,
  getLoanDetail,
  recordPayment,
} from '../controllers/collectionController';

// ---- Sales ----
export const salesRouter = Router();
salesRouter.use(authenticate, authorize(Role.Sales));
salesRouter.get('/leads', getLeads);

// ---- Sanction ----
export const sanctionRouter = Router();
sanctionRouter.use(authenticate, authorize(Role.Sanction));
sanctionRouter.get('/loans', getApplied);
sanctionRouter.post('/loans/:id/approve', approve);
sanctionRouter.post('/loans/:id/reject', reject);

// ---- Disbursement ----
export const disbursementRouter = Router();
disbursementRouter.use(authenticate, authorize(Role.Disbursement));
disbursementRouter.get('/loans', getSanctioned);
disbursementRouter.post('/loans/:id/disburse', disburse);

// ---- Collection ----
export const collectionRouter = Router();
collectionRouter.use(authenticate, authorize(Role.Collection));
collectionRouter.get('/loans', getCollectible);
collectionRouter.get('/loans/:id', getLoanDetail);
collectionRouter.post('/loans/:id/payments', recordPayment);

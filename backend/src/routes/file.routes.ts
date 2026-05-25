import { Router } from 'express';
import { authenticateFlexible } from '../middleware/auth';
import { getSalarySlip } from '../controllers/fileController';

const router = Router();

// Flexible auth so the salary slip can be opened directly in a browser tab
// using a token query param (an Authorization header can't be set on a link).
router.get('/salary-slip/:loanId', authenticateFlexible, getSalarySlip);

export default router;

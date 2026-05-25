import { Router } from 'express';
import {
  submitPersonalDetails,
  uploadSlip,
  getQuote,
  applyForLoan,
  getMyLoan,
} from '../controllers/loanController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadSalarySlip } from '../middleware/upload';
import { Role } from '../types';

const router = Router();

// All borrower routes require an authenticated Borrower (Admin allowed too).
router.use(authenticate, authorize(Role.Borrower));

router.get('/me', getMyLoan);
router.get('/quote', getQuote);
router.post('/personal-details', submitPersonalDetails);
router.post('/salary-slip', uploadSalarySlip, uploadSlip);
router.post('/apply', applyForLoan);

export default router;

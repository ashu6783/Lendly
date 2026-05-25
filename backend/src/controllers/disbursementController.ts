import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { LoanStatus } from '../types';

/**
 * GET /api/disbursement/loans
 * Sanctioned loans waiting for funds to be released.
 */
export const getSanctioned = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ status: LoanStatus.SANCTIONED })
    .populate('borrower', 'name email')
    .sort({ sanctionedAt: 1 });
  res.json({ loans });
});

/**
 * POST /api/disbursement/loans/:id/disburse
 * Transition: SANCTIONED -> DISBURSED (funds released; loan becomes active).
 */
export const disburse = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');
  if (loan.status !== LoanStatus.SANCTIONED) {
    throw ApiError.conflict(`Cannot disburse a loan in status ${loan.status}`);
  }

  loan.status = LoanStatus.DISBURSED;
  loan.disbursedBy = req.user!.id as unknown as typeof loan.disbursedBy;
  loan.disbursedAt = new Date();
  await loan.save();

  res.json({ loan });
});

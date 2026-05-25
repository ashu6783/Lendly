import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { LoanStatus } from '../types';

/**
 * GET /api/sanction/loans
 * Loans awaiting a sanction decision (status APPLIED).
 */
export const getApplied = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ status: LoanStatus.APPLIED })
    .populate('borrower', 'name email')
    .sort({ appliedAt: 1 });
  res.json({ loans });
});

/**
 * POST /api/sanction/loans/:id/approve
 * Transition: APPLIED -> SANCTIONED
 */
export const approve = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');
  if (loan.status !== LoanStatus.APPLIED) {
    throw ApiError.conflict(`Cannot sanction a loan in status ${loan.status}`);
  }

  loan.status = LoanStatus.SANCTIONED;
  loan.sanctionedBy = req.user!.id as unknown as typeof loan.sanctionedBy;
  loan.sanctionedAt = new Date();
  loan.rejectionReason = undefined;
  await loan.save();

  res.json({ loan });
});

/**
 * POST /api/sanction/loans/:id/reject  { reason }
 * Transition: APPLIED -> REJECTED (reason required).
 */
export const reject = asyncHandler(async (req: Request, res: Response) => {
  const reason = (req.body as { reason?: string }).reason?.trim();
  if (!reason) throw ApiError.badRequest('A rejection reason is required');

  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');
  if (loan.status !== LoanStatus.APPLIED) {
    throw ApiError.conflict(`Cannot reject a loan in status ${loan.status}`);
  }

  loan.status = LoanStatus.REJECTED;
  loan.rejectionReason = reason;
  loan.sanctionedBy = req.user!.id as unknown as typeof loan.sanctionedBy;
  loan.sanctionedAt = new Date();
  await loan.save();

  res.json({ loan });
});

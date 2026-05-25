import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { LoanStatus } from '../types';

/**
 * GET /api/collection/loans
 * Active loans (DISBURSED) plus recently closed ones for reference.
 */
export const getCollectible = asyncHandler(async (_req: Request, res: Response) => {
  const loans = await Loan.find({ status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] } })
    .populate('borrower', 'name email')
    .sort({ status: 1, disbursedAt: 1 });
  res.json({ loans });
});

/**
 * GET /api/collection/loans/:id
 * Loan detail with full payment history and outstanding balance.
 */
export const getLoanDetail = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findById(req.params.id).populate('borrower', 'name email');
  if (!loan) throw ApiError.notFound('Loan not found');
  const payments = await Payment.find({ loan: loan._id }).sort({ date: 1 });
  res.json({ loan, payments });
});

/**
 * POST /api/collection/loans/:id/payments  { utr, amount, date }
 * Records a borrower payment. Validations:
 *  - loan must be DISBURSED (active)
 *  - UTR must be unique across all payments
 *  - amount must be > 0 and must not exceed the outstanding balance
 * When the total paid reaches the total repayment, the loan auto-closes.
 */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { utr, amount, date } = req.body as {
    utr?: string;
    amount?: number;
    date?: string;
  };

  if (!utr || !utr.trim()) throw ApiError.badRequest('UTR number is required');
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw ApiError.badRequest('Payment amount must be greater than 0');
  }
  const paymentDate = date ? new Date(date) : new Date();
  if (Number.isNaN(paymentDate.getTime())) {
    throw ApiError.badRequest('Invalid payment date');
  }

  const loan = await Loan.findById(req.params.id);
  if (!loan) throw ApiError.notFound('Loan not found');
  if (loan.status !== LoanStatus.DISBURSED) {
    throw ApiError.conflict(
      `Payments can only be recorded on active (disbursed) loans. Current status: ${loan.status}`
    );
  }

  const outstanding = loan.outstanding;
  if (amt > outstanding + 1e-6) {
    throw ApiError.badRequest(
      `Payment exceeds the outstanding balance of ₹${outstanding.toLocaleString('en-IN')}`
    );
  }

  // Enforce UTR uniqueness explicitly for a friendly message
  // (the DB unique index is the ultimate guard against races).
  const dupe = await Payment.findOne({ utr: utr.trim().toUpperCase() });
  if (dupe) throw ApiError.conflict('A payment with this UTR already exists');

  const payment = await Payment.create({
    loan: loan._id,
    utr: utr.trim().toUpperCase(),
    amount: amt,
    date: paymentDate,
    recordedBy: req.user!.id,
  });

  loan.amountPaid = Math.round((loan.amountPaid + amt) * 100) / 100;

  // Auto-close when fully repaid.
  if (loan.totalRepayment != null && loan.amountPaid + 1e-6 >= loan.totalRepayment) {
    loan.amountPaid = loan.totalRepayment;
    loan.status = LoanStatus.CLOSED;
    loan.closedAt = new Date();
  }
  await loan.save();

  const payments = await Payment.find({ loan: loan._id }).sort({ date: 1 });
  res.status(201).json({ loan, payment, payments });
});

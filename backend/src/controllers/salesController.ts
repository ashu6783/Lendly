import { Request, Response } from 'express';
import { User } from '../models/User';
import { Loan } from '../models/Loan';
import { asyncHandler } from '../utils/ApiError';
import { Role, LoanStatus } from '../types';

/**
 * GET /api/sales/leads
 * Pre-application lead tracking. Lists every borrower and where they are in the
 * funnel: REGISTERED (no loan yet), IN_PROGRESS (DRAFT started), or APPLIED+.
 */
export const getLeads = asyncHandler(async (_req: Request, res: Response) => {
  const borrowers = await User.find({ role: Role.Borrower }).sort({ createdAt: -1 });

  const loans = await Loan.find({
    borrower: { $in: borrowers.map((b) => b._id) },
  }).sort({ updatedAt: -1 });

  // Map each borrower to their latest loan (if any).
  const latestByBorrower = new Map<string, (typeof loans)[number]>();
  for (const loan of loans) {
    const key = String(loan.borrower);
    if (!latestByBorrower.has(key)) latestByBorrower.set(key, loan);
  }

  const leads = borrowers.map((b) => {
    const loan = latestByBorrower.get(String(b._id));
    let stage: 'REGISTERED' | 'IN_PROGRESS' | 'APPLIED';
    if (!loan) stage = 'REGISTERED';
    else if (loan.status === LoanStatus.DRAFT) stage = 'IN_PROGRESS';
    else stage = 'APPLIED';

    return {
      id: String(b._id),
      name: b.name,
      email: b.email,
      registeredAt: b.createdAt,
      stage,
      loanStatus: loan?.status ?? null,
      hasSalarySlip: Boolean(loan?.salarySlip),
    };
  });

  res.json({ leads });
});

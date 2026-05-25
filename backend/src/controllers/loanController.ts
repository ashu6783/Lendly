import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';
import { ApiError, asyncHandler } from '../utils/ApiError';
import { runBRE } from '../services/bre';
import { quoteLoan, validateLoanConfig } from '../services/loanMath';
import { EmploymentMode, LoanStatus } from '../types';

// Finds the borrower's current working loan (anything not rejected/closed),
// preferring the most recently updated one.
async function findActiveLoan(borrowerId: string) {
  return Loan.findOne({
    borrower: borrowerId,
    status: { $nin: [LoanStatus.REJECTED, LoanStatus.CLOSED] },
  }).sort({ updatedAt: -1 });
}

/**
 * POST /api/loans/personal-details
 * Runs the BRE. On pass, creates or updates the borrower's DRAFT loan.
 * On fail, returns 422 with the list of reasons — no loan is created.
 */
export const submitPersonalDetails = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body as {
    fullName?: string;
    pan?: string;
    dateOfBirth?: string;
    monthlySalary?: number;
    employmentMode?: EmploymentMode;
  };

  if (!fullName || !pan || !dateOfBirth || monthlySalary == null || !employmentMode) {
    throw ApiError.badRequest('All personal detail fields are required');
  }

  const bre = runBRE({
    pan,
    dateOfBirth: new Date(dateOfBirth),
    monthlySalary: Number(monthlySalary),
    employmentMode,
  });

  if (!bre.passed) {
    // 422: the request was well-formed but failed business rules.
    throw ApiError.unprocessable('Application rejected by eligibility check', {
      failures: bre.failures,
    });
  }

  const borrowerId = req.user!.id;
  const personalDetails = {
    fullName,
    pan: pan.toUpperCase(),
    dateOfBirth: new Date(dateOfBirth),
    monthlySalary: Number(monthlySalary),
    employmentMode,
  };

  let loan = await findActiveLoan(borrowerId);
  if (loan && loan.status === LoanStatus.DRAFT) {
    loan.personalDetails = personalDetails;
    await loan.save();
  } else if (!loan) {
    loan = await Loan.create({
      borrower: borrowerId,
      personalDetails,
      status: LoanStatus.DRAFT,
    });
  } else {
    // An application already moved past DRAFT — don't overwrite it.
    throw ApiError.conflict('You already have an application in progress');
  }

  res.status(201).json({ eligible: true, loan });
});

/**
 * POST /api/loans/salary-slip  (multipart/form-data, field "salarySlip")
 * Attaches the uploaded file to the borrower's DRAFT loan.
 */
export const uploadSlip = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded. Use field name "salarySlip".');
  }

  const loan = await findActiveLoan(req.user!.id);
  if (!loan || loan.status !== LoanStatus.DRAFT) {
    throw ApiError.badRequest('Submit personal details before uploading a salary slip');
  }

  loan.salarySlip = {
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
  };
  await loan.save();

  res.json({ loan });
});

/**
 * GET /api/loans/quote?amount=&tenureDays=
 * Live repayment calculation. The client mirrors this for the slider panel,
 * but the server recomputes on apply so the numbers can't be tampered with.
 */
export const getQuote = asyncHandler(async (req: Request, res: Response) => {
  const amount = Number(req.query.amount);
  const tenureDays = Number(req.query.tenureDays);
  const error = validateLoanConfig(amount, tenureDays);
  if (error) throw ApiError.badRequest(error);
  res.json(quoteLoan(amount, tenureDays));
});

/**
 * POST /api/loans/apply  { amount, tenureDays }
 * Locks in the loan config, recomputes interest server-side, sets status APPLIED.
 */
export const applyForLoan = asyncHandler(async (req: Request, res: Response) => {
  const amount = Number((req.body as { amount?: number }).amount);
  const tenureDays = Number((req.body as { tenureDays?: number }).tenureDays);

  const error = validateLoanConfig(amount, tenureDays);
  if (error) throw ApiError.badRequest(error);

  const loan = await findActiveLoan(req.user!.id);
  if (!loan || loan.status !== LoanStatus.DRAFT) {
    throw ApiError.badRequest('Complete the previous steps before applying');
  }
  if (!loan.salarySlip) {
    throw ApiError.badRequest('Upload a salary slip before applying');
  }

  const quote = quoteLoan(amount, tenureDays);
  loan.amount = quote.amount;
  loan.tenureDays = quote.tenureDays;
  loan.interestRate = quote.interestRate;
  loan.simpleInterest = quote.simpleInterest;
  loan.totalRepayment = quote.totalRepayment;
  loan.status = LoanStatus.APPLIED;
  loan.appliedAt = new Date();
  await loan.save();

  res.status(201).json({ loan });
});

/**
 * GET /api/loans/me
 * Returns the borrower's most recent loan plus its payment history.
 */
export const getMyLoan = asyncHandler(async (req: Request, res: Response) => {
  const loan = await Loan.findOne({ borrower: req.user!.id }).sort({ updatedAt: -1 });
  if (!loan) {
    res.json({ loan: null, payments: [] });
    return;
  }
  const payments = await Payment.find({ loan: loan._id }).sort({ date: 1 });
  res.json({ loan, payments });
});

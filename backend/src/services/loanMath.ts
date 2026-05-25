import {
  INTEREST_RATE,
  MIN_LOAN_AMOUNT,
  MAX_LOAN_AMOUNT,
  MIN_TENURE_DAYS,
  MAX_TENURE_DAYS,
} from '../types';

export interface LoanQuote {
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Simple Interest formula from the assignment:
 *   SI = (P * R * T) / (365 * 100), where T = tenure in days
 *   Total Repayment = P + SI
 * Interest rate is fixed at 12% p.a.
 */
export function quoteLoan(amount: number, tenureDays: number): LoanQuote {
  const simpleInterest = round2((amount * INTEREST_RATE * tenureDays) / (365 * 100));
  const totalRepayment = round2(amount + simpleInterest);
  return {
    amount,
    tenureDays,
    interestRate: INTEREST_RATE,
    simpleInterest,
    totalRepayment,
  };
}

// Validates loan configuration ranges; returns an error message or null.
export function validateLoanConfig(amount: number, tenureDays: number): string | null {
  if (!Number.isFinite(amount) || amount < MIN_LOAN_AMOUNT || amount > MAX_LOAN_AMOUNT) {
    return `Loan amount must be between ₹${MIN_LOAN_AMOUNT.toLocaleString(
      'en-IN'
    )} and ₹${MAX_LOAN_AMOUNT.toLocaleString('en-IN')}.`;
  }
  if (
    !Number.isInteger(tenureDays) ||
    tenureDays < MIN_TENURE_DAYS ||
    tenureDays > MAX_TENURE_DAYS
  ) {
    return `Tenure must be between ${MIN_TENURE_DAYS} and ${MAX_TENURE_DAYS} days.`;
  }
  return null;
}

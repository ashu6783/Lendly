import type { EmploymentMode } from '@/types';

export const INTEREST_RATE = 12; // % p.a. fixed
export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_SALARY = 25000;
export const MIN_LOAN = 50000;
export const MAX_LOAN = 500000;
export const MIN_TENURE = 30;
export const MAX_TENURE = 365;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface Quote {
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

// Mirrors the server formula so the slider panel updates instantly.
// The server recomputes on apply, so this is purely for live feedback.
export function quote(amount: number, tenureDays: number): Quote {
  const simpleInterest =
    Math.round(((amount * INTEREST_RATE * tenureDays) / (365 * 100)) * 100) / 100;
  const totalRepayment = Math.round((amount + simpleInterest) * 100) / 100;
  return { amount, tenureDays, interestRate: INTEREST_RATE, simpleInterest, totalRepayment };
}

// Client mirror of the BRE for instant feedback; the server is authoritative.
export function localBRE(input: {
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}): string[] {
  const failures: string[] = [];
  const dob = new Date(input.dateOfBirth);
  if (!input.dateOfBirth || Number.isNaN(dob.getTime())) {
    failures.push('A valid date of birth is required.');
  } else {
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
    if (age < MIN_AGE || age > MAX_AGE) {
      failures.push(`Age must be between ${MIN_AGE} and ${MAX_AGE} (currently ${age}).`);
    }
  }
  if (input.monthlySalary < MIN_SALARY) {
    failures.push(`Monthly salary must be at least ₹${MIN_SALARY.toLocaleString('en-IN')}.`);
  }
  if (!PAN_REGEX.test((input.pan || '').toUpperCase())) {
    failures.push('PAN must look like ABCDE1234F.');
  }
  if (input.employmentMode === 'Unemployed') {
    failures.push('Unemployed applicants are not eligible.');
  }
  return failures;
}

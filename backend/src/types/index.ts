// Central definitions for roles and loan lifecycle states.
// Keeping these as enums avoids magic strings across the codebase.

export enum Role {
  Admin = 'Admin',
  Sales = 'Sales',
  Sanction = 'Sanction',
  Disbursement = 'Disbursement',
  Collection = 'Collection',
  Borrower = 'Borrower',
}

export const ALL_ROLES: Role[] = Object.values(Role);

export enum LoanStatus {
  // Borrower has passed the BRE and started an application but not yet submitted.
  DRAFT = 'DRAFT',
  // Borrower has submitted the loan request — awaiting sanction review.
  APPLIED = 'APPLIED',
  // Sanction executive approved the loan.
  SANCTIONED = 'SANCTIONED',
  // Sanction executive rejected the loan (with a reason).
  REJECTED = 'REJECTED',
  // Disbursement executive released the funds.
  DISBURSED = 'DISBURSED',
  // Loan fully repaid — auto-closed by the collection module.
  CLOSED = 'CLOSED',
}

export enum EmploymentMode {
  Salaried = 'Salaried',
  SelfEmployed = 'Self-Employed',
  Unemployed = 'Unemployed',
}

// Fixed business constants from the assignment.
export const INTEREST_RATE = 12; // % per annum, fixed
export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_SALARY = 25000; // INR / month
export const MIN_LOAN_AMOUNT = 50000; // 50K
export const MAX_LOAN_AMOUNT = 500000; // 5L
export const MIN_TENURE_DAYS = 30;
export const MAX_TENURE_DAYS = 365;

// PAN format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

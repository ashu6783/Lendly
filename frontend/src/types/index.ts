export type Role =
  | 'Admin'
  | 'Sales'
  | 'Sanction'
  | 'Disbursement'
  | 'Collection'
  | 'Borrower';

export type LoanStatus =
  | 'DRAFT'
  | 'APPLIED'
  | 'SANCTIONED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CLOSED';

export type EmploymentMode = 'Salaried' | 'Self-Employed' | 'Unemployed';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PersonalDetails {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface SalarySlip {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface Loan {
  _id: string;
  borrower: string | { _id: string; name: string; email: string };
  personalDetails: PersonalDetails;
  salarySlip?: SalarySlip;
  amount?: number;
  tenureDays?: number;
  interestRate?: number;
  simpleInterest?: number;
  totalRepayment?: number;
  status: LoanStatus;
  rejectionReason?: string;
  amountPaid: number;
  outstanding: number;
  appliedAt?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  loan: string;
  utr: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  stage: 'REGISTERED' | 'IN_PROGRESS' | 'APPLIED';
  loanStatus: LoanStatus | null;
  hasSalarySlip: boolean;
}

export interface LoanQuote {
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
}

import type { LoanStatus, Role } from '@/types';

export function inr(n: number | undefined | null): string {
  if (n == null) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

export function inr2(n: number | undefined | null): string {
  if (n == null) return '₹0.00';
  return (
    '₹' +
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function formatDate(d?: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Tailwind classes per loan status — used by the Badge component.
export const STATUS_STYLES: Record<LoanStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  APPLIED: 'bg-amber-50 text-amber-700 ring-amber-200',
  SANCTIONED: 'bg-sky-50 text-sky-700 ring-sky-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-200',
  DISBURSED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  CLOSED: 'bg-brand-50 text-brand-700 ring-brand-100',
};

export interface ModuleDef {
  key: string;
  label: string;
  href: string;
  role: Role;
  description: string;
}

// The four dashboard modules. Each maps to a role; Admin sees all of them.
export const MODULES: ModuleDef[] = [
  {
    key: 'sales',
    label: 'Sales',
    href: '/dashboard/sales',
    role: 'Sales',
    description: 'Track registered leads who have not yet applied.',
  },
  {
    key: 'sanction',
    label: 'Sanction',
    href: '/dashboard/sanction',
    role: 'Sanction',
    description: 'Review applied loans and approve or reject them.',
  },
  {
    key: 'disbursement',
    label: 'Disbursement',
    href: '/dashboard/disbursement',
    role: 'Disbursement',
    description: 'Release funds for sanctioned loans.',
  },
  {
    key: 'collection',
    label: 'Collection',
    href: '/dashboard/collection',
    role: 'Collection',
    description: 'Record repayments and close settled loans.',
  },
];

export function modulesForRole(role: Role): ModuleDef[] {
  if (role === 'Admin') return MODULES;
  return MODULES.filter((m) => m.role === role);
}

// The borrower field is populated (object) on staff endpoints, a string elsewhere.
export function borrowerOf(borrower: string | { name: string; email: string }): {
  name: string;
  email: string;
} {
  if (typeof borrower === 'string') return { name: 'Borrower', email: '' };
  return { name: borrower.name, email: borrower.email };
}

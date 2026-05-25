'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Spinner } from '@/components/ui';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    router.replace(user.role === 'Borrower' ? '/apply' : '/dashboard');
  }, [user, loading, router]);

  if (loading || user) return <Spinner label="Loading…" />;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
          Lending, end to end
        </span>
        <h1 className="mt-6 max-w-2xl font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl">
          A loan management system for borrowers and operations teams.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-muted">
          Borrowers apply through a guided flow with live eligibility and repayment
          maths. Internal teams move each loan through its lifecycle — sales, sanction,
          disbursement, and collection — with role-based access throughout.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button className="px-6 py-3 text-base">Apply for a loan</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="px-6 py-3 text-base">
              Staff sign in
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-4">
        {[
          ['Apply', 'Borrowers submit details, pass the rule engine, and configure a loan.'],
          ['Sanction', 'Executives review applications and approve or reject with a reason.'],
          ['Disburse', 'Approved loans get funds released and become active.'],
          ['Collect', 'Payments are recorded and loans auto-close when fully repaid.'],
        ].map(([title, desc], i) => (
          <div
            key={title}
            className="animate-fade-up rounded-2xl border border-edge bg-surface p-5 shadow-card"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="font-display text-sm font-semibold text-brand-600">
              0{i + 1}
            </span>
            <p className="mt-2 font-display font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-ink-muted">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

'use client';

import type { Loan } from '@/types';
import { Card, Badge } from '@/components/ui';
import { inr, inr2, formatDate } from '@/lib/format';

const STAGES = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'] as const;

export function LoanTracker({ loan }: { loan: Loan }) {
  const isRejected = loan.status === 'REJECTED';
  const currentIndex = STAGES.indexOf(loan.status as (typeof STAGES)[number]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-muted">Application status</p>
          <p className="font-display text-lg font-semibold text-ink">
            {inr(loan.amount)} · {loan.tenureDays} days
          </p>
        </div>
        <Badge status={loan.status} />
      </div>

      <div className="px-6 py-6">
        {isRejected ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
            <p className="font-semibold">Application rejected</p>
            <p className="mt-1">{loan.rejectionReason || 'No reason provided.'}</p>
          </div>
        ) : (
          <ol className="flex items-center">
            {STAGES.map((stage, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <li key={stage} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-1',
                        done
                          ? 'bg-brand-600 text-white ring-brand-600'
                          : active
                            ? 'bg-brand-50 text-brand-700 ring-brand-500'
                            : 'bg-white text-ink-muted ring-edge',
                      ].join(' ')}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    <span
                      className={`mt-2 text-[11px] font-medium ${
                        done || active ? 'text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {stage.charAt(0) + stage.slice(1).toLowerCase()}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 rounded ${
                        i < currentIndex ? 'bg-brand-600' : 'bg-edge'
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Detail label="Principal" value={inr(loan.amount)} />
          <Detail label="Interest (12% p.a.)" value={inr2(loan.simpleInterest)} />
          <Detail label="Total repayment" value={inr2(loan.totalRepayment)} />
          <Detail label="Amount paid" value={inr2(loan.amountPaid)} />
          <Detail label="Outstanding" value={inr2(loan.outstanding)} />
          <Detail label="Applied on" value={formatDate(loan.appliedAt)} />
        </dl>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

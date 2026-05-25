'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Alert, EmptyState, Button, Badge } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { inr, inr2, formatDate, borrowerOf } from '@/lib/format';
import type { Loan } from '@/types';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api<{ loans: Loan[] }>('/api/disbursement/loans')
      .then((res) => setLoans(res.loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Disbursement — release funds</h1>
      <p className="mt-1 text-ink-muted">Sanctioned loans ready for disbursement.</p>

      {loading ? (
        <Spinner label="Loading sanctioned loans…" />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : loans.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to disburse"
            subtitle="Sanctioned loans will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {loans.map((loan) => (
            <Card key={loan._id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold text-ink">
                    {borrowerOf(loan.borrower).name}
                  </p>
                  <Badge status={loan.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <Mini label="Amount" value={inr(loan.amount)} />
                  <Mini label="Tenure" value={`${loan.tenureDays} d`} />
                  <Mini label="Repayment" value={inr2(loan.totalRepayment)} />
                  <Mini label="Sanctioned" value={formatDate(loan.sanctionedAt)} />
                </dl>
              </div>
              <DisburseButton loan={loan} onDone={load} onError={setError} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DisburseButton({
  loan,
  onDone,
  onError,
}: {
  loan: Loan;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function disburse() {
    setLoading(true);
    try {
      await api(`/api/disbursement/loans/${loan._id}/disburse`, { method: 'POST' });
      onDone();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Failed to disburse');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button onClick={disburse} loading={loading}>
      Mark as disbursed
    </Button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}

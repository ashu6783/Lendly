'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Alert, EmptyState, Button, Badge, Field, Input } from '@/components/ui';
import { api, ApiError, apiBase, getToken } from '@/lib/api';
import { inr, inr2, formatDate, borrowerOf } from '@/lib/format';
import type { Loan } from '@/types';

export default function SanctionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Loan | null>(null);

  function load() {
    setLoading(true);
    api<{ loans: Loan[] }>('/api/sanction/loans')
      .then((res) => setLoans(res.loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sanction — review applications</h1>
      <p className="mt-1 text-ink-muted">Approve or reject loans awaiting a decision.</p>

      {loading ? (
        <Spinner label="Loading applications…" />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : loans.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing to review" subtitle="Applied loans will appear here." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {loans.map((loan) => (
            <Card key={loan._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-ink">
                      {borrowerOf(loan.borrower).name}
                    </p>
                    <Badge status={loan.status} />
                  </div>
                  <p className="text-xs text-ink-muted">{borrowerOf(loan.borrower).email}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                    <Mini label="Amount" value={inr(loan.amount)} />
                    <Mini label="Tenure" value={`${loan.tenureDays} d`} />
                    <Mini label="Repayment" value={inr2(loan.totalRepayment)} />
                    <Mini label="Applied" value={formatDate(loan.appliedAt)} />
                    <Mini label="PAN" value={loan.personalDetails.pan} />
                    <Mini label="Salary" value={inr(loan.personalDetails.monthlySalary)} />
                    <Mini label="Employment" value={loan.personalDetails.employmentMode} />
                  </dl>
                  {loan.salarySlip && (
                    <a
                      href={`${apiBase}/api/files/salary-slip/${loan._id}?token=${getToken()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline"
                    >
                      View salary slip
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => setSelected(loan)}>
                    Reject
                  </Button>
                  <ApproveButton loan={loan} onDone={load} onError={setError} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <RejectModal
          loan={selected}
          onClose={() => setSelected(null)}
          onDone={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ApproveButton({
  loan,
  onDone,
  onError,
}: {
  loan: Loan;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function approve() {
    setLoading(true);
    try {
      await api(`/api/sanction/loans/${loan._id}/approve`, { method: 'POST' });
      onDone();
    } catch (e) {
      onError(e instanceof ApiError ? e.message : 'Failed to approve');
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button onClick={approve} loading={loading}>
      Approve
    </Button>
  );
}

function RejectModal({
  loan,
  onClose,
  onDone,
}: {
  loan: Loan;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!reason.trim()) {
      setError('A reason is required.');
      return;
    }
    setLoading(true);
    try {
      await api(`/api/sanction/loans/${loan._id}/reject`, {
        method: 'POST',
        body: { reason: reason.trim() },
      });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to reject');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <Card className="w-full max-w-md p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Reject application</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {borrowerOf(loan.borrower).name} · {inr(loan.amount)}
        </p>
        <div className="mt-4 space-y-3">
          {error && <Alert variant="error">{error}</Alert>}
          <Field label="Reason for rejection">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Insufficient income proof"
            />
          </Field>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={submit} loading={loading} className="flex-1">
              Confirm rejection
            </Button>
          </div>
        </div>
      </Card>
    </div>
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

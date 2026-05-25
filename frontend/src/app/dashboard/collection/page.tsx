'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Alert, EmptyState, Button, Badge, Field, Input } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { inr, inr2, formatDate, borrowerOf } from '@/lib/format';
import type { Loan, Payment } from '@/types';

export default function CollectionPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api<{ loans: Loan[] }>('/api/collection/loans')
      .then((res) => setLoans(res.loans))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const active = loans.filter((l) => l.status === 'DISBURSED');
  const closed = loans.filter((l) => l.status === 'CLOSED');

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Collection — record payments</h1>
      <p className="mt-1 text-ink-muted">
        Active loans accept payments. A loan closes automatically once fully repaid.
      </p>

      {loading ? (
        <Spinner label="Loading active loans…" />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : loans.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No active loans" subtitle="Disbursed loans will appear here." />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <Section title={`Active (${active.length})`}>
            {active.length === 0 ? (
              <p className="text-sm text-ink-muted">No active loans right now.</p>
            ) : (
              active.map((loan) => (
                <LoanRow
                  key={loan._id}
                  loan={loan}
                  open={openId === loan._id}
                  onToggle={() => setOpenId(openId === loan._id ? null : loan._id)}
                  onPaid={(updated) => {
                    setLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
                  }}
                />
              ))
            )}
          </Section>

          {closed.length > 0 && (
            <Section title={`Closed (${closed.length})`}>
              {closed.map((loan) => (
                <Card key={loan._id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{borrowerOf(loan.borrower).name}</span>
                    <Badge status={loan.status} />
                  </div>
                  <span className="text-sm text-ink-muted">
                    Repaid {inr2(loan.totalRepayment)} · closed {formatDate(loan.closedAt)}
                  </span>
                </Card>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function LoanRow({
  loan,
  open,
  onToggle,
  onPaid,
}: {
  loan: Loan;
  open: boolean;
  onToggle: () => void;
  onPaid: (l: Loan) => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingDetail(true);
    api<{ payments: Payment[] }>(`/api/collection/loans/${loan._id}`)
      .then((res) => setPayments(res.payments))
      .catch(() => setPayments([]))
      .finally(() => setLoadingDetail(false));
  }, [open, loan._id]);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink">
              {borrowerOf(loan.borrower).name}
            </span>
            <Badge status={loan.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Outstanding <span className="font-medium text-ink">{inr2(loan.outstanding)}</span> of{' '}
            {inr2(loan.totalRepayment)}
          </p>
        </div>
        <span className="text-ink-muted">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-edge bg-paper/40 p-5">
          {/* Progress bar */}
          <div className="mb-5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-edge">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{
                  width: `${
                    loan.totalRepayment
                      ? Math.min(100, (loan.amountPaid / loan.totalRepayment) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Paid {inr2(loan.amountPaid)} of {inr2(loan.totalRepayment)}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PaymentForm loan={loan} onPaid={(updated, ps) => { onPaid(updated); setPayments(ps); }} />
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Payment history
              </h3>
              {loadingDetail ? (
                <p className="text-sm text-ink-muted">Loading…</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-ink-muted">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {payments.map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-edge"
                    >
                      <span className="font-mono text-xs text-ink-muted">{p.utr}</span>
                      <span className="text-ink-muted">
                        {new Date(p.date).toLocaleDateString('en-IN')}
                      </span>
                      <span className="font-medium text-ink">{inr2(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function PaymentForm({
  loan,
  onPaid,
}: {
  loan: Loan;
  onPaid: (loan: Loan, payments: Payment[]) => void;
}) {
  const [utr, setUtr] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setOk('');
    const amt = Number(amount);
    if (!utr.trim()) return setError('UTR is required.');
    if (!Number.isFinite(amt) || amt <= 0) return setError('Amount must be greater than 0.');
    if (amt > loan.outstanding + 1e-6)
      return setError(`Amount exceeds outstanding ${inr2(loan.outstanding)}.`);

    setLoading(true);
    try {
      const res = await api<{ loan: Loan; payments: Payment[] }>(
        `/api/collection/loans/${loan._id}/payments`,
        { method: 'POST', body: { utr: utr.trim(), amount: amt, date } }
      );
      setUtr('');
      setAmount('');
      setOk(
        res.loan.status === 'CLOSED'
          ? 'Payment recorded — loan fully repaid and closed.'
          : 'Payment recorded.'
      );
      onPaid(res.loan, res.payments);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  }

  const settled = loan.status === 'CLOSED';

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Record a payment
      </h3>
      <div className="space-y-3">
        {error && <Alert variant="error">{error}</Alert>}
        {ok && <Alert variant="success">{ok}</Alert>}
        <Field label="UTR number" hint="Must be unique across all payments">
          <Input
            value={utr}
            onChange={(e) => setUtr(e.target.value.toUpperCase())}
            className="font-mono"
            placeholder="UTR2026XXXX"
            disabled={settled}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(Math.round(loan.outstanding))}
              disabled={settled}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={settled}
            />
          </Field>
        </div>
        <Button onClick={submit} loading={loading} disabled={settled} className="w-full">
          {settled ? 'Loan closed' : 'Record payment'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppHeader } from '@/components/AppHeader';
import { LoanTracker } from '@/components/LoanTracker';
import { Button, Card, Field, Input, Select, Alert, Spinner } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { inr, inr2 } from '@/lib/format';
import {
  quote,
  localBRE,
  MIN_LOAN,
  MAX_LOAN,
  MIN_TENURE,
  MAX_TENURE,
} from '@/lib/loan';
import type { Loan, Payment, EmploymentMode } from '@/types';

type Step = 'details' | 'upload' | 'config' | 'submitted';

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Personal details' },
  { key: 'upload', label: 'Salary slip' },
  { key: 'config', label: 'Configure & apply' },
];

export default function ApplyPage() {
  return (
    <ProtectedRoute allow={['Borrower']}>
      <AppHeader />
      <ApplyFlow />
    </ProtectedRoute>
  );
}

function ApplyFlow() {
  const [loading, setLoading] = useState(true);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [step, setStep] = useState<Step>('details');

  // Determine the starting step from the borrower's existing loan, if any.
  useEffect(() => {
    api<{ loan: Loan | null; payments: Payment[] }>('/api/loans/me')
      .then(({ loan, payments }) => {
        setLoan(loan);
        setPayments(payments || []);
        if (!loan) setStep('details');
        else if (loan.status !== 'DRAFT') setStep('submitted');
        else if (!loan.salarySlip) setStep('upload');
        else setStep('config');
        // If a draft exists with no personal details captured, stay on details.
        if (loan && loan.status === 'DRAFT' && !loan.personalDetails?.pan) {
          setStep('details');
        }
      })
      .catch(() => setStep('details'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading your application…" />;

  if (step === 'submitted' && loan) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">Your loan</h1>
        <p className="mt-1 text-ink-muted">Track your application as our teams review it.</p>
        <div className="mt-6">
          <LoanTracker loan={loan} />
        </div>
        {payments.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Payments</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-muted">
                  <th className="pb-2">UTR</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-edge">
                    <td className="py-2 font-mono text-xs">{p.utr}</td>
                    <td className="py-2">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                    <td className="py-2 text-right">{inr2(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    );
  }

  const activeIndex = STEP_LABELS.findIndex((s) => s.key === step);

  return (
    <main
      className={`mx-auto px-6 py-10 ${step === 'config' ? 'max-w-5xl' : 'max-w-2xl'}`}
    >
      <h1 className="font-display text-3xl font-bold text-ink">Apply for a loan</h1>

      {/* Step indicator */}
      <ol className="mt-6 flex items-center gap-2">
        {STEP_LABELS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                i < activeIndex
                  ? 'bg-brand-600 text-white'
                  : i === activeIndex
                    ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                    : 'bg-white text-ink-muted ring-1 ring-edge',
              ].join(' ')}
            >
              {i < activeIndex ? '✓' : i + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:block ${
                i <= activeIndex ? 'text-ink' : 'text-ink-muted'
              }`}
            >
              {s.label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span
                className={`h-0.5 flex-1 rounded ${
                  i < activeIndex ? 'bg-brand-600' : 'bg-edge'
                }`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 animate-fade-up">
        {step === 'details' && (
          <DetailsStep
            loan={loan}
            onDone={(l) => {
              setLoan(l);
              setStep('upload');
            }}
          />
        )}
        {step === 'upload' && (
          <UploadStep
            loan={loan}
            onBack={() => setStep('details')}
            onDone={(l) => {
              setLoan(l);
              setStep('config');
            }}
          />
        )}
        {step === 'config' && (
          <ConfigStep
            onBack={() => setStep('upload')}
            onDone={(l) => {
              setLoan(l);
              setStep('submitted');
            }}
          />
        )}
      </div>
    </main>
  );
}

/* ---------------- Step 2: Personal details + BRE ---------------- */
function DetailsStep({ loan, onDone }: { loan: Loan | null; onDone: (l: Loan) => void }) {
  const pd = loan?.personalDetails;
  const [fullName, setFullName] = useState(pd?.fullName ?? '');
  const [pan, setPan] = useState(pd?.pan ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    pd?.dateOfBirth ? pd.dateOfBirth.slice(0, 10) : ''
  );
  const [monthlySalary, setMonthlySalary] = useState<string>(
    pd?.monthlySalary ? String(pd.monthlySalary) : ''
  );
  const [employmentMode, setEmploymentMode] = useState<EmploymentMode>(
    pd?.employmentMode ?? 'Salaried'
  );
  const [failures, setFailures] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setFailures([]);
    if (!fullName || !pan || !dateOfBirth || !monthlySalary) {
      setError('Please fill in all fields.');
      return;
    }
    // Instant client-side BRE feedback before hitting the server.
    const local = localBRE({
      pan,
      dateOfBirth,
      monthlySalary: Number(monthlySalary),
      employmentMode,
    });
    if (local.length) {
      setFailures(local);
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ loan: Loan }>('/api/loans/personal-details', {
        method: 'POST',
        body: {
          fullName,
          pan: pan.toUpperCase(),
          dateOfBirth,
          monthlySalary: Number(monthlySalary),
          employmentMode,
        },
      });
      onDone(res.loan);
    } catch (err) {
      if (err instanceof ApiError && err.details?.failures) {
        setFailures(err.details.failures);
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <h2 className="font-display text-xl font-semibold text-ink">Personal details</h2>
      <p className="mt-1 text-sm text-ink-muted">
        We run an eligibility check on these details before you can continue.
      </p>

      <div className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {failures.length > 0 && (
          <Alert variant="error" title="You are not eligible">
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {failures.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Alert>
        )}

        <Field label="Full name">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="PAN" hint="Format: ABCDE1234F">
            <Input
              value={pan}
              onChange={(e) => setPan(e.target.value.toUpperCase())}
              maxLength={10}
              className="font-mono uppercase"
              placeholder="ABCDE1234F"
            />
          </Field>
          <Field label="Date of birth">
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly salary (₹)" hint="Minimum ₹25,000">
            <Input
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              placeholder="40000"
            />
          </Field>
          <Field label="Employment mode">
            <Select
              value={employmentMode}
              onChange={(e) => setEmploymentMode(e.target.value as EmploymentMode)}
            >
              <option value="Salaried">Salaried</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Unemployed">Unemployed</option>
            </Select>
          </Field>
        </div>

        <Button onClick={submit} loading={loading} className="w-full">
          Check eligibility & continue
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- Step 3: Upload salary slip ---------------- */
function UploadStep({
  loan,
  onBack,
  onDone,
}: {
  loan: Loan | null;
  onBack: () => void;
  onDone: (l: Loan) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const existing = loan?.salarySlip;

  async function upload() {
    setError('');
    if (!file && !existing) {
      setError('Please choose a file.');
      return;
    }
    if (!file && existing) {
      // Already uploaded — just continue.
      if (loan) onDone(loan);
      return;
    }
    if (file && file.size > 5 * 1024 * 1024) {
      setError('File exceeds the 5 MB limit.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('salarySlip', file as File);
      const res = await api<{ loan: Loan }>('/api/loans/salary-slip', {
        method: 'POST',
        body: form,
        isForm: true,
      });
      onDone(res.loan);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-7">
      <h2 className="font-display text-xl font-semibold text-ink">Upload salary slip</h2>
      <p className="mt-1 text-sm text-ink-muted">PDF, JPG, or PNG — up to 5 MB.</p>

      <div className="mt-6 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {existing && (
          <Alert variant="success">
            Uploaded: <span className="font-medium">{existing.originalName}</span>. You can
            replace it or continue.
          </Alert>
        )}

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge bg-paper/50 px-6 py-10 text-center transition-colors hover:border-brand-500">
          <span className="font-display text-sm font-semibold text-ink">
            {file ? file.name : 'Click to choose a file'}
          </span>
          <span className="mt-1 text-xs text-ink-muted">PDF / JPG / PNG, max 5 MB</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={upload} loading={loading} className="flex-1">
            Continue
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Step 4: Loan configuration + apply ---------------- */
function ConfigStep({ onBack, onDone }: { onBack: () => void; onDone: (l: Loan) => void }) {
  const [amount, setAmount] = useState(200000);
  const [tenureDays, setTenureDays] = useState(180);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const q = useMemo(() => quote(amount, tenureDays), [amount, tenureDays]);

  async function apply() {
    setError('');
    setLoading(true);
    try {
      const res = await api<{ loan: Loan }>('/api/loans/apply', {
        method: 'POST',
        body: { amount, tenureDays },
      });
      onDone(res.loan);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit application');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-7 lg:col-span-3">
        <h2 className="font-display text-xl font-semibold text-ink">Configure your loan</h2>
        <p className="mt-1 text-sm text-ink-muted">Interest is fixed at 12% per annum.</p>

        <div className="mt-7 space-y-8">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-soft">Loan amount</span>
              <span className="font-display text-lg font-semibold text-ink">{inr(amount)}</span>
            </div>
            <input
              type="range"
              min={MIN_LOAN}
              max={MAX_LOAN}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-muted">
              <span>{inr(MIN_LOAN)}</span>
              <span>{inr(MAX_LOAN)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-soft">Tenure</span>
              <span className="font-display text-lg font-semibold text-ink">
                {tenureDays} days
              </span>
            </div>
            <input
              type="range"
              min={MIN_TENURE}
              max={MAX_TENURE}
              step={1}
              value={tenureDays}
              onChange={(e) => setTenureDays(Number(e.target.value))}
              className="mt-3 w-full"
            />
            <div className="mt-1 flex justify-between text-xs text-ink-muted">
              <span>{MIN_TENURE} days</span>
              <span>{MAX_TENURE} days</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Live calculation panel — plain div avoids Card's default bg-surface overriding custom bg */}
      <div className="flex flex-col rounded-2xl border border-brand-200 bg-brand-50 p-7 shadow-card lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
          Live repayment
        </p>
        <div className="mt-4 space-y-4">
          <SummaryRow label="Principal" value={inr(q.amount)} />
          <SummaryRow label="Interest rate" value="12% p.a." />
          <SummaryRow label="Tenure" value={`${q.tenureDays} days`} />
          <div className="h-px bg-brand-200" />
          <SummaryRow label="Simple interest" value={inr2(q.simpleInterest)} />
          <div>
            <p className="text-sm text-ink-muted">Total repayment</p>
            <p className="font-display text-3xl font-bold text-ink">{inr2(q.totalRepayment)}</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
          SI = (P × R × T) / (365 × 100). Recomputed on the server when you apply.
        </p>

        {error && (
          <div className="mt-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}
        <div className="mt-auto flex gap-3 pt-6">
          <Button variant="secondary" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={apply} loading={loading} className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

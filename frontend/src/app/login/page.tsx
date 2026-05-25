'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, Input, Alert } from '@/components/ui';
import { ApiError } from '@/lib/api';

const SEED_ACCOUNTS = [
  ['Admin', 'admin@lms.test'],
  ['Sales', 'sales@lms.test'],
  ['Sanction', 'sanction@lms.test'],
  ['Disbursement', 'disbursement@lms.test'],
  ['Collection', 'collection@lms.test'],
  ['Borrower', 'borrower@lms.test'],
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      router.replace(user.role === 'Borrower' ? '/apply' : '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-2">
      <div className="hidden lg:block">
        <Link href="/" className="font-display text-2xl font-bold text-ink">
          Lendly
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold leading-tight text-ink">
          Sign in to your account
        </h1>
        <p className="mt-4 max-w-md text-ink-muted">
          Borrowers reach the application portal. Operations staff land on the module
          dashboard mapped to their role.
        </p>

        <Card className="mt-8 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Evaluator test accounts
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Password for all: <span className="font-mono text-ink">Password123</span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SEED_ACCOUNTS.map(([role, mail]) => (
              <button
                key={mail}
                onClick={() => {
                  setEmail(mail);
                  setPassword('Password123');
                }}
                className="rounded-lg border border-edge bg-paper px-3 py-2 text-left text-xs transition-colors hover:border-brand-500"
              >
                <span className="block font-medium text-ink">{role}</span>
                <span className="block font-mono text-[11px] text-ink-muted">{mail}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="w-full max-w-md justify-self-center lg:justify-self-end">
        <Card className="p-7">
          <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-muted">Enter your credentials to continue.</p>

          <div className="mt-6 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            <Button onClick={handleSubmit} loading={loading} className="w-full">
              Sign in
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            New borrower?{' '}
            <Link href="/signup" className="font-medium text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}

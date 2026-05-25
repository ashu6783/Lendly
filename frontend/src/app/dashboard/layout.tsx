'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppHeader } from '@/components/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { modulesForRole } from '@/lib/format';
import { cx } from '@/components/ui';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allow={['Sales', 'Sanction', 'Disbursement', 'Collection']}>
      <AppHeader />
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const modules = user ? modulesForRole(user.role) : [];

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-5 py-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-24 space-y-1">
          <Link
            href="/dashboard"
            className={cx(
              'block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              pathname === '/dashboard'
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-white hover:text-ink'
            )}
          >
            Overview
          </Link>
          {modules.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.key}
                href={m.href}
                className={cx(
                  'block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-ink text-white' : 'text-ink-muted hover:bg-white hover:text-ink'
                )}
              >
                {m.label}
              </Link>
            );
          })}
          {user?.role === 'Admin' && (
            <p className="px-3.5 pt-3 text-xs text-ink-muted">
              Admin — all modules visible.
            </p>
          )}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

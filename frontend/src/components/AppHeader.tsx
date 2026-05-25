'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui';

export function AppHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  const home = user?.role === 'Borrower' ? '/apply' : user ? '/dashboard' : '/';

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-paper/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href={home} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-display text-sm font-bold text-white">
            L
          </span>
          <span className="font-display text-lg font-semibold text-ink">Lendly</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
              <p className="text-xs leading-tight text-ink-muted">{user.role}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <Button variant="ghost" onClick={handleLogout} className="px-3 py-1.5">
              Sign out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import type { Role } from '@/types';

/**
 * Client-side access guard. Redirects unauthenticated users to /login and
 * users without an allowed role away from the page. This is a UX convenience —
 * the backend independently enforces the same rules on every request.
 */
export function ProtectedRoute({
  allow,
  children,
}: {
  allow?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (allow && user.role !== 'Admin' && !allow.includes(user.role)) {
      // Send users to the area they are allowed to see.
      router.replace(user.role === 'Borrower' ? '/apply' : '/dashboard');
    }
  }, [user, loading, allow, router]);

  if (loading || !user) return <Spinner label="Loading…" />;
  if (allow && user.role !== 'Admin' && !allow.includes(user.role)) {
    return <Spinner label="Redirecting…" />;
  }
  return <>{children}</>;
}

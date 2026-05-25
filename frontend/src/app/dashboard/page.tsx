'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui';
import { modulesForRole } from '@/lib/format';

export default function DashboardOverview() {
  const { user } = useAuth();
  if (!user) return null;
  const modules = modulesForRole(user.role);

  return (
    <div>
      <p className="text-sm text-ink-muted">Welcome back,</p>
      <h1 className="font-display text-3xl font-bold text-ink">{user.name}</h1>
      <p className="mt-1 text-ink-muted">
        {user.role === 'Admin'
          ? 'You have access to every operations module.'
          : `You manage the ${user.role} module.`}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <Link key={m.key} href={m.href}>
            <Card className="group h-full p-6 transition-shadow hover:shadow-lift">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">{m.label}</h2>
                <span className="text-ink-muted transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{m.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, Spinner, Alert, EmptyState } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Lead } from '@/types';

const STAGE_STYLE: Record<Lead['stage'], string> = {
  REGISTERED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  APPLIED: 'bg-brand-50 text-brand-700',
};

const STAGE_LABEL: Record<Lead['stage'], string> = {
  REGISTERED: 'Registered',
  IN_PROGRESS: 'In progress',
  APPLIED: 'Applied',
};

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ leads: Lead[] }>('/api/sales/leads')
      .then((res) => setLeads(res.leads))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    REGISTERED: leads.filter((l) => l.stage === 'REGISTERED').length,
    IN_PROGRESS: leads.filter((l) => l.stage === 'IN_PROGRESS').length,
    APPLIED: leads.filter((l) => l.stage === 'APPLIED').length,
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sales — lead tracking</h1>
      <p className="mt-1 text-ink-muted">
        Registered borrowers and where they sit in the application funnel.
      </p>

      {loading ? (
        <Spinner label="Loading leads…" />
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Registered" value={counts.REGISTERED} />
            <Stat label="In progress" value={counts.IN_PROGRESS} />
            <Stat label="Applied" value={counts.APPLIED} />
          </div>

          {leads.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="No leads yet" subtitle="Borrowers will appear here once they register." />
            </div>
          ) : (
            <Card className="mt-6 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Borrower</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                    <th className="px-5 py-3 font-medium">Salary slip</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id} className="border-t border-edge">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{l.name}</p>
                        <p className="text-xs text-ink-muted">{l.email}</p>
                      </td>
                      <td className="px-5 py-3 text-ink-muted">{formatDate(l.registeredAt)}</td>
                      <td className="px-5 py-3 text-ink-muted">
                        {l.hasSalarySlip ? 'Uploaded' : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLE[l.stage]}`}
                        >
                          {STAGE_LABEL[l.stage]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </Card>
  );
}

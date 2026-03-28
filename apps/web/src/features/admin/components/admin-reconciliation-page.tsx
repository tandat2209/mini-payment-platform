import { AlertTriangle, ReceiptText, Webhook } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminReconciliationExceptionItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, shortenIdentifier, toTitleCase } from '@/lib/formatters';

export function AdminReconciliationPage({
  error,
  exceptions,
  isLoading,
}: {
  error: string | null;
  exceptions: AdminReconciliationExceptionItem[];
  isLoading: boolean;
}): JSX.Element {
  return (
    <AdminPageShell
      description="Surface unresolved webhook issues, failed payout operations, and ledger integrity problems from one exception queue."
      eyebrow="Reconciliation"
      metrics={[
        {
          icon: AlertTriangle,
          label: 'Exceptions',
          value: isLoading ? 'Loading' : String(exceptions.length),
        },
        {
          icon: Webhook,
          label: 'Webhook-related',
          value: String(exceptions.filter((item) => item.kind === 'webhook_processing').length),
        },
        {
          icon: ReceiptText,
          label: 'Ledger-related',
          value: String(exceptions.filter((item) => item.kind === 'ledger_integrity').length),
        },
      ]}
      title="Reconciliation exceptions"
    >
      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              Loading reconciliation exceptions...
            </CardContent>
          </Card>
        ) : exceptions.length === 0 ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              No reconciliation exceptions are currently open.
            </CardContent>
          </Card>
        ) : (
          exceptions.map((item) => (
            <Card
              className="rounded-[24px] border border-slate-200 bg-white/95"
              key={`${item.kind}-${item.sourceId}`}
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{item.summary}</p>
                      <Badge tone={item.severity === 'high' ? 'warning' : 'default'}>
                        {toTitleCase(item.severity)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {toTitleCase(item.kind.replaceAll('_', ' '))}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.occurredAt
                      ? formatDate(item.occurredAt, {
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                        })
                      : 'No timestamp'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Meta label="Reference" value={item.reference ?? 'Not set'} />
                  <Meta
                    label="Payout"
                    value={
                      item.linkedPayoutId ? shortenIdentifier(item.linkedPayoutId) : 'Not linked'
                    }
                  />
                  <Meta
                    label="Transaction"
                    value={
                      item.linkedTransactionId
                        ? shortenIdentifier(item.linkedTransactionId)
                        : 'Not linked'
                    }
                  />
                  <Meta
                    label="Webhook / Ledger"
                    value={
                      item.linkedWebhookEventId
                        ? shortenIdentifier(item.linkedWebhookEventId)
                        : item.linkedLedgerTransactionId
                          ? shortenIdentifier(item.linkedLedgerTransactionId)
                          : 'Not linked'
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}

function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words font-medium text-slate-900">{value}</p>
    </div>
  );
}

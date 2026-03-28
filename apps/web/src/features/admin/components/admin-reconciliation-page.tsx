import { AlertTriangle, ReceiptText, Webhook } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminReconciliationExceptionItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, shortenIdentifier, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminReconciliationPage({
  error,
  exceptions,
  isLoading,
}: {
  error: string | null;
  exceptions: AdminReconciliationExceptionItem[];
  isLoading: boolean;
}): JSX.Element {
  const [selectedExceptionKey, setSelectedExceptionKey] = useState<string | null>(null);
  const selectedException = useMemo(
    () => exceptions.find((item) => getExceptionKey(item) === selectedExceptionKey) ?? null,
    [exceptions, selectedExceptionKey],
  );

  return (
    <AdminPageShell
      description="Work the exception queue across webhook processing, payout operations, and ledger integrity."
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
      <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5">
          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f4efe7] text-left">
                  <tr>
                    {['Summary', 'Kind', 'Severity', 'Reference', 'Occurred'].map((header) => (
                      <th
                        className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        key={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        Loading reconciliation exceptions...
                      </td>
                    </tr>
                  ) : exceptions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        No reconciliation exceptions are currently open.
                      </td>
                    </tr>
                  ) : (
                    exceptions.map((item) => {
                      const exceptionKey = getExceptionKey(item);

                      return (
                        <tr
                          className={cn(
                            'cursor-pointer transition hover:bg-slate-50',
                            selectedExceptionKey === exceptionKey && 'bg-emerald-50/50',
                          )}
                          key={exceptionKey}
                          onClick={() =>
                            setSelectedExceptionKey((current) =>
                              current === exceptionKey ? null : exceptionKey,
                            )
                          }
                        >
                          <td className="px-3 py-3 align-top">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-950">{item.summary}</p>
                              <p className="truncate text-xs text-slate-500">
                                {shortenIdentifier(item.sourceId)}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top text-sm text-slate-700">
                            {toTitleCase(item.kind.replaceAll('_', ' '))}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <Badge tone={item.severity === 'high' ? 'warning' : 'default'}>
                              {toTitleCase(item.severity)}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 align-top text-sm text-slate-700">
                            {item.reference ?? 'Not set'}
                          </td>
                          <td className="px-3 py-3 align-top text-sm text-slate-700">
                            {item.occurredAt
                              ? formatDate(item.occurredAt, {
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                })
                              : 'No timestamp'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => !open && setSelectedExceptionKey(null)}
        open={selectedException !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Exception
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedException?.summary ?? 'Exception detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedException ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailCard
                    label="Kind"
                    value={toTitleCase(selectedException.kind.replaceAll('_', ' '))}
                  />
                  <DetailCard label="Severity" value={toTitleCase(selectedException.severity)} />
                  <DetailCard label="Reference" value={selectedException.reference ?? 'Not set'} />
                  <DetailCard
                    label="Source"
                    value={shortenIdentifier(selectedException.sourceId)}
                  />
                  <DetailCard
                    label="Occurred"
                    value={
                      selectedException.occurredAt
                        ? formatDate(selectedException.occurredAt, {
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'No timestamp'
                    }
                  />
                  <DetailCard
                    label="Payout"
                    value={
                      selectedException.linkedPayoutId
                        ? shortenIdentifier(selectedException.linkedPayoutId)
                        : 'Not linked'
                    }
                  />
                  <DetailCard
                    label="Transaction"
                    value={
                      selectedException.linkedTransactionId
                        ? shortenIdentifier(selectedException.linkedTransactionId)
                        : 'Not linked'
                    }
                  />
                  <DetailCard
                    label="Webhook"
                    value={
                      selectedException.linkedWebhookEventId
                        ? shortenIdentifier(selectedException.linkedWebhookEventId)
                        : 'Not linked'
                    }
                  />
                  <DetailCard
                    label="Ledger"
                    value={
                      selectedException.linkedLedgerTransactionId
                        ? shortenIdentifier(selectedException.linkedLedgerTransactionId)
                        : 'Not linked'
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
}

function DetailCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words font-medium text-slate-900">{value}</p>
    </div>
  );
}

function getExceptionKey(item: AdminReconciliationExceptionItem): string {
  return `${item.kind}-${item.sourceId}`;
}

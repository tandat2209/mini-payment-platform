import { Activity, Webhook } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminWebhookEventItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, getToneFromStatus, shortenIdentifier, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminWebhooksPage({
  error,
  events,
  isLoading,
  onOpenPayouts,
  onOpenReconciliation,
  onOpenTransactions,
}: {
  error: string | null;
  events: AdminWebhookEventItem[];
  isLoading: boolean;
  onOpenPayouts: (query: string) => void;
  onOpenReconciliation: (query: string) => void;
  onOpenTransactions: (query: string) => void;
}): JSX.Element {
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const selectedWebhook = useMemo(
    () => events.find((event) => event.id === selectedWebhookId) ?? null,
    [events, selectedWebhookId],
  );

  return (
    <AdminPageShell
      description="Inspect provider callbacks and the internal records linked to each event."
      eyebrow="Webhooks"
      metrics={[
        {
          icon: Webhook,
          label: 'Events loaded',
          value: isLoading ? 'Loading' : String(events.length),
        },
        {
          icon: Activity,
          label: 'Needs review',
          value: String(events.filter((event) => event.processingStatus !== 'processed').length),
        },
      ]}
      title="Webhook queue"
    >
      <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5">
          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7f9ff]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f4efe7] text-left">
                  <tr>
                    {['Event', 'Provider', 'Processing', 'Linked payout', 'Received'].map(
                      (header) => (
                        <th
                          className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                          key={header}
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        Loading webhook events...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        No webhook events are available for this admin view.
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr
                        className={cn(
                          'cursor-pointer transition hover:bg-slate-50',
                          selectedWebhookId === event.id && 'bg-[#f4f7ff]',
                        )}
                        key={event.id}
                        onClick={() =>
                          setSelectedWebhookId((current) =>
                            current === event.id ? null : event.id,
                          )
                        }
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">{event.eventType}</p>
                            <p className="truncate text-xs text-slate-500">
                              {shortenIdentifier(event.externalEventId)}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {event.provider}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge tone={getToneFromStatus(event.processingStatus)}>
                            {toTitleCase(event.processingStatus)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {event.linkedPayoutId
                            ? shortenIdentifier(event.linkedPayoutId)
                            : 'Not linked'}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {event.receivedAt
                            ? formatDate(event.receivedAt, {
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                              })
                            : 'No timestamp'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => !open && setSelectedWebhookId(null)}
        open={selectedWebhook !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Webhook
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedWebhook?.eventType ?? 'Webhook detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedWebhook ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Provider" value={selectedWebhook.provider} />
                    <DetailCard
                      label="Processing"
                      value={toTitleCase(selectedWebhook.processingStatus)}
                    />
                    <DetailCard label="Webhook ID" value={shortenIdentifier(selectedWebhook.id)} />
                    <DetailCard
                      label="External event"
                      value={shortenIdentifier(selectedWebhook.externalEventId)}
                    />
                    <DetailCard
                      label="Received"
                      value={
                        selectedWebhook.receivedAt
                          ? formatDate(selectedWebhook.receivedAt, {
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
                      label="Processed"
                      value={
                        selectedWebhook.processedAt
                          ? formatDate(selectedWebhook.processedAt, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not processed'
                      }
                    />
                    <DetailCard
                      label="Linked payout"
                      value={
                        selectedWebhook.linkedPayoutId
                          ? shortenIdentifier(selectedWebhook.linkedPayoutId)
                          : 'Not linked'
                      }
                    />
                    <DetailCard
                      label="Linked transaction"
                      value={
                        selectedWebhook.linkedTransactionId
                          ? shortenIdentifier(selectedWebhook.linkedTransactionId)
                          : 'Not linked'
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Payload
                    </p>
                    <div className="overflow-x-auto rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
                      <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                        {JSON.stringify(selectedWebhook.payload, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Related pages
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedWebhook.linkedPayoutId ? (
                        <Button
                          className="h-9 rounded-full px-3"
                          onClick={() => onOpenPayouts(selectedWebhook.linkedPayoutId ?? '')}
                          type="button"
                          variant="outline"
                        >
                          Open payout
                        </Button>
                      ) : null}
                      {selectedWebhook.linkedTransactionId ? (
                        <Button
                          className="h-9 rounded-full px-3"
                          onClick={() =>
                            onOpenTransactions(selectedWebhook.linkedTransactionId ?? '')
                          }
                          type="button"
                          variant="outline"
                        >
                          Open transaction
                        </Button>
                      ) : null}
                      <Button
                        className="h-9 rounded-full px-3"
                        onClick={() => onOpenReconciliation(selectedWebhook.id)}
                        type="button"
                        variant="outline"
                      >
                        Open reconciliation
                      </Button>
                    </div>
                  </div>
                </>
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

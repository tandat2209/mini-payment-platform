import { Activity, Webhook } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminWebhookEventItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, getToneFromStatus, shortenIdentifier, toTitleCase } from '@/lib/formatters';

export function AdminWebhooksPage({
  error,
  events,
  isLoading,
}: {
  error: string | null;
  events: AdminWebhookEventItem[];
  isLoading: boolean;
}): JSX.Element {
  return (
    <AdminPageShell
      description="Inspect raw provider events, processing outcomes, and the linked internal records created from each webhook."
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
      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              Loading webhook events...
            </CardContent>
          </Card>
        ) : events.length === 0 ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              No webhook events are available for this admin view.
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card className="rounded-[24px] border border-slate-200 bg-white/95" key={event.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{event.eventType}</p>
                      <Badge tone={getToneFromStatus(event.processingStatus)}>
                        {toTitleCase(event.processingStatus)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {event.provider} · {event.externalEventId}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {event.receivedAt
                      ? formatDate(event.receivedAt, {
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                        })
                      : 'No received time'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <Meta label="Webhook ID" value={shortenIdentifier(event.id)} />
                  <Meta
                    label="Payout"
                    value={
                      event.linkedPayoutId ? shortenIdentifier(event.linkedPayoutId) : 'Not linked'
                    }
                  />
                  <Meta
                    label="Transaction"
                    value={
                      event.linkedTransactionId
                        ? shortenIdentifier(event.linkedTransactionId)
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

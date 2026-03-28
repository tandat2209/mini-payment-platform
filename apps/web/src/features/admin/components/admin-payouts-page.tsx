import { ArrowLeftRight, Radar, Webhook } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminPayoutItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import {
  formatDate,
  formatMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from '@/lib/formatters';

export function AdminPayoutsPage({
  error,
  isLoading,
  payouts,
}: {
  error: string | null;
  isLoading: boolean;
  payouts: AdminPayoutItem[];
}): JSX.Element {
  return (
    <AdminPageShell
      description="Track payout lifecycle, provider attempt state, and linked customer transactions from one operator view."
      eyebrow="Payouts"
      metrics={[
        {
          icon: ArrowLeftRight,
          label: 'Rows loaded',
          value: isLoading ? 'Loading' : String(payouts.length),
        },
        {
          icon: Radar,
          label: 'Submitted',
          value: String(
            payouts.filter((item) => item.status === 'submitted' || item.status === 'processing')
              .length,
          ),
        },
        {
          icon: Webhook,
          label: 'With webhook',
          value: String(payouts.filter((item) => item.latestWebhookEventId !== null).length),
        },
      ]}
      title="Payout operations"
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
              Loading payout operations...
            </CardContent>
          </Card>
        ) : payouts.length === 0 ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              No payouts are available for this admin view.
            </CardContent>
          </Card>
        ) : (
          payouts.map((payout) => (
            <Card className="rounded-[24px] border border-slate-200 bg-white/95" key={payout.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-slate-950">
                        {payout.reference ?? shortenIdentifier(payout.id)}
                      </p>
                      <Badge tone={getToneFromStatus(payout.status)}>
                        {toTitleCase(payout.status)}
                      </Badge>
                      {payout.attemptStatus ? (
                        <Badge tone="default">Attempt {toTitleCase(payout.attemptStatus)}</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {payout.customer.externalRef} {'->'} {payout.recipient.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-950">
                      {formatMoney(payout.amounts.gross)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Fee {formatMoney(payout.amounts.fee)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <Meta label="Customer" value={payout.customer.externalRef} />
                  <Meta label="Recipient" value={payout.recipient.name} />
                  <Meta label="Wallet" value={shortenIdentifier(payout.walletId)} />
                  <Meta label="Transaction" value={shortenIdentifier(payout.userTransactionId)} />
                  <Meta label="Provider" value={payout.provider ?? 'Not submitted'} />
                  <Meta label="External payout" value={payout.externalPayoutId ?? 'Not assigned'} />
                  <Meta
                    label="Webhook"
                    value={
                      payout.latestWebhookEventId
                        ? shortenIdentifier(payout.latestWebhookEventId)
                        : 'Waiting'
                    }
                  />
                  <Meta
                    label="Submitted"
                    value={
                      payout.submittedAt
                        ? formatDate(payout.submittedAt, {
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                          })
                        : 'Not yet'
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

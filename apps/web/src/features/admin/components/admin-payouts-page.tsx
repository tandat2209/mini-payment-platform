import { ArrowLeftRight, Radar, Webhook } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminPayoutItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import {
  formatDate,
  formatMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminPayoutsPage({
  error,
  isLoading,
  payouts,
}: {
  error: string | null;
  isLoading: boolean;
  payouts: AdminPayoutItem[];
}): JSX.Element {
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const selectedPayout = useMemo(
    () => payouts.find((payout) => payout.id === selectedPayoutId) ?? null,
    [payouts, selectedPayoutId],
  );

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
                    {['Reference', 'Customer', 'Recipient', 'Gross', 'Status', 'Submitted'].map(
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
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                        Loading payout operations...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                        No payouts are available for this admin view.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr
                        className={cn(
                          'cursor-pointer transition hover:bg-slate-50',
                          selectedPayoutId === payout.id && 'bg-emerald-50/50',
                        )}
                        key={payout.id}
                        onClick={() =>
                          setSelectedPayoutId((current) =>
                            current === payout.id ? null : payout.id,
                          )
                        }
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">
                              {payout.reference ?? shortenIdentifier(payout.id)}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {shortenIdentifier(payout.id)}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {payout.customer.externalRef}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {payout.recipient.name}
                        </td>
                        <td className="px-3 py-3 align-top text-sm font-semibold text-slate-950">
                          {formatMoney(payout.amounts.gross)}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={getToneFromStatus(payout.status)}>
                              {toTitleCase(payout.status)}
                            </Badge>
                            {payout.attemptStatus ? (
                              <Badge tone="default">
                                Attempt {toTitleCase(payout.attemptStatus)}
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {payout.submittedAt
                            ? formatDate(payout.submittedAt, {
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                              })
                            : 'Not yet'}
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
        onOpenChange={(open) => !open && setSelectedPayoutId(null)}
        open={selectedPayout !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Payout
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedPayout?.reference ??
                  (selectedPayout ? shortenIdentifier(selectedPayout.id) : 'Payout detail')}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedPayout ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Customer" value={selectedPayout.customer.externalRef} />
                    <DetailCard label="Recipient" value={selectedPayout.recipient.name} />
                    <DetailCard label="Gross" value={formatMoney(selectedPayout.amounts.gross)} />
                    <DetailCard label="Fee" value={formatMoney(selectedPayout.amounts.fee)} />
                    <DetailCard label="Status" value={toTitleCase(selectedPayout.status)} />
                    <DetailCard
                      label="Attempt"
                      value={
                        selectedPayout.attemptStatus
                          ? toTitleCase(selectedPayout.attemptStatus)
                          : 'Not submitted'
                      }
                    />
                    <DetailCard
                      label="Provider"
                      value={selectedPayout.provider ?? 'Not submitted'}
                    />
                    <DetailCard
                      label="External payout"
                      value={selectedPayout.externalPayoutId ?? 'Not assigned'}
                    />
                    <DetailCard label="Wallet" value={shortenIdentifier(selectedPayout.walletId)} />
                    <DetailCard
                      label="Transaction"
                      value={shortenIdentifier(selectedPayout.userTransactionId)}
                    />
                    <DetailCard
                      label="Webhook"
                      value={
                        selectedPayout.latestWebhookEventId
                          ? shortenIdentifier(selectedPayout.latestWebhookEventId)
                          : 'Waiting'
                      }
                    />
                    <DetailCard
                      label="Submitted"
                      value={
                        selectedPayout.submittedAt
                          ? formatDate(selectedPayout.submittedAt, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                            })
                          : 'Not yet'
                      }
                    />
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

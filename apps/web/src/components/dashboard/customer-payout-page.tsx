import { ArrowRightLeft, Radio, Send } from 'lucide-react';
import type { JSX } from 'react';

import type { RecipientSummary, WalletBalance } from '../../api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { EmptyState, LoadingBlock, SummaryFigure } from './shared';
import { formatMoney, toTitleCase } from './utils';

export function CustomerPayoutPage({
  isRecipientsLoading,
  recipients,
  visibleBalances,
}: {
  isRecipientsLoading: boolean;
  recipients: RecipientSummary[];
  visibleBalances: WalletBalance[];
}): JSX.Element {
  const payoutReadyRails = recipients.flatMap((recipient) =>
    recipient.rails
      .filter((rail) => rail.payoutReady)
      .map((rail) => ({
        ...rail,
        recipientId: recipient.id,
        recipientName: recipient.name,
      })),
  );
  const blockedRails = recipients.flatMap((recipient) =>
    recipient.rails
      .filter((rail) => !rail.payoutReady)
      .map((rail) => ({
        ...rail,
        recipientId: recipient.id,
        recipientName: recipient.name,
      })),
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Payout
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Outbound movement setup
              </h1>
            </div>
            <Button className="rounded-xl px-4" disabled variant="outline">
              <Send className="h-4 w-4" />
              Payout flow next
            </Button>
          </div>

          <div className="grid gap-4 rounded-[24px] border border-[#e7e1d8] bg-[#fcfaf6] p-4 sm:grid-cols-3">
            <SummaryFigure
              label="Ready rails"
              note="Saved payout destinations already usable by the next payout API."
              tone="emerald"
              value={String(payoutReadyRails.length)}
            />
            <SummaryFigure
              label="Needs work"
              note="Recipient rails still blocked on provider registration or correction."
              tone="amber"
              value={String(blockedRails.length)}
            />
            <SummaryFigure
              label="Funded pockets"
              note="Wallet balances that can back future outbound money movement."
              tone="slate"
              value={String(visibleBalances.length)}
            />
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(0,1.4fr)_140px_160px] gap-3 border-b border-slate-200 bg-[#faf7f2] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>Source balance</span>
              <span>Available</span>
              <span>Pending</span>
            </div>
            <div className="divide-y divide-slate-200/70">
              {visibleBalances.length > 0 ? (
                visibleBalances.map((balance) => (
                  <div
                    className="grid grid-cols-[minmax(0,1.4fr)_140px_160px] gap-3 px-4 py-3"
                    key={balance.currency}
                  >
                    <div>
                      <p className="font-medium text-slate-950">{balance.currency} balance</p>
                      <p className="text-sm text-slate-500">Primary payout funding pocket</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">
                      {formatMoney(balance.available)}
                    </p>
                    <p className="text-sm text-slate-500">{formatMoney(balance.pending)}</p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-slate-500">
                  No funded balances available for payout preparation yet.
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(0,1.2fr)_110px_120px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-[#faf7f2] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>Recipient rail</span>
              <span>Rail</span>
              <span>Status</span>
              <span>Submission mode</span>
            </div>
            <div className="divide-y divide-slate-200/70">
              {isRecipientsLoading ? (
                <div className="space-y-3 px-4 py-4">
                  <LoadingBlock className="h-14" />
                  <LoadingBlock className="h-14" />
                </div>
              ) : payoutReadyRails.length > 0 ? (
                payoutReadyRails.map((rail) => (
                  <div
                    className="grid grid-cols-[minmax(0,1.2fr)_110px_120px_minmax(0,1fr)] gap-3 px-4 py-3"
                    key={rail.id}
                  >
                    <div>
                      <p className="font-medium text-slate-950">{rail.recipientName}</p>
                      <p className="text-sm text-slate-500">
                        Future payout request uses <code>{rail.id}</code>
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-950">{toTitleCase(rail.rail)}</p>
                    <div>
                      <Badge tone="positive">Ready</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {rail.providerRegistrationStrategy === 'provider_managed'
                        ? 'Provider beneficiary reference'
                        : 'Stored rail details inline'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-4">
                  <EmptyState
                    message="Create and activate a recipient rail first. The payout flow will target that saved rail instead of asking for bank details again."
                    title="No payout-ready recipient rails"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fcfaf6] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
        <CardContent className="space-y-4 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Payout boundary
          </p>
          <div className="space-y-3">
            <div className="rounded-[22px] border border-white bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <ArrowRightLeft className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">What the next payout API takes</p>
                  <p className="text-sm text-slate-500">
                    `recipientRailId`, amount, currency, source wallet, and reference.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-[22px] border border-white bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Blocked rails
              </p>
              {blockedRails.length > 0 ? (
                blockedRails.map((rail) => (
                  <div
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-[#fcfaf6] px-3 py-3"
                    key={rail.id}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-slate-400" />
                        <p className="text-sm font-medium text-slate-900">
                          {rail.recipientName} · {toTitleCase(rail.rail)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {rail.providerRegistrationError ??
                          `${toTitleCase(rail.readinessStatus)} before payout`}
                      </p>
                    </div>
                    <Badge tone="warning">{toTitleCase(rail.readinessStatus)}</Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  message="All currently saved rails are payout ready."
                  title="No blocked payout rails"
                />
              )}
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-500">
            The customer-facing payout flow will stay recipient-first: saved rail selection first,
            provider-specific submission strategy second.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

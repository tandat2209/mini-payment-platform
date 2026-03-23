import { Send } from 'lucide-react';
import type { JSX } from 'react';

import type { WalletBalance } from '../../api';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { formatMoney } from './utils';

const payoutHighlights = [
  {
    body: 'Create outbound transfers from your available balance once recipient setup and compliance checks are complete.',
    title: 'Payout readiness',
  },
  {
    body: 'Use transaction references and beneficiary records to reconcile payout batches after they post.',
    title: 'Ops traceability',
  },
];

export function CustomerPayoutPage({
  visibleBalances,
}: {
  visibleBalances: WalletBalance[];
}): JSX.Element {
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
            <Button className="rounded-xl px-4" variant="outline">
              <Send className="h-4 w-4" />
              Start payout
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {payoutHighlights.map((item) => (
              <div
                className="rounded-[24px] border border-[#e7e1d8] bg-[#fcfaf6] p-4"
                key={item.title}
              >
                <p className="text-base font-semibold text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
            ))}
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
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fcfaf6] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
        <CardContent className="space-y-4 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Checklist
          </p>
          <div className="space-y-3">
            {[
              'Recipient details verified',
              'Funding balance available',
              'Reference ready for reconciliation',
            ].map((item) => (
              <div
                className="flex items-center justify-between rounded-[18px] border border-white bg-white px-4 py-3"
                key={item}
              >
                <span className="text-sm font-medium text-slate-700">{item}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Ready
                </span>
              </div>
            ))}
          </div>
          <p className="text-sm leading-6 text-slate-500">
            This page owns the payout workflow surface, so payout setup no longer competes with
            balances or funding details inside the same long dashboard page.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

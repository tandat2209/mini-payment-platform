import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { adminBalanceSnapshots } from '@/features/admin/data/admin-preview-data';
import { formatMoney } from '@/lib/formatters';

export function AdminBalancesPage(): JSX.Element {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Balances
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Currency exposure monitor
            </h1>
          </div>
          <div className="text-sm text-slate-500">Cross-wallet balance summary</div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
          <div className="grid grid-cols-[120px_180px_180px_140px_140px] gap-3 border-b border-slate-200 bg-[#f4efe7] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <span>Currency</span>
            <span>Available</span>
            <span>Pending</span>
            <span>Wallets</span>
            <span>Posted today</span>
          </div>
          <div className="divide-y divide-slate-200/80 bg-white">
            {adminBalanceSnapshots.map((balance) => (
              <div
                className="grid grid-cols-[120px_180px_180px_140px_140px] gap-3 px-4 py-3"
                key={balance.currency}
              >
                <p className="text-sm font-semibold text-slate-950">{balance.currency}</p>
                <p className="text-sm font-semibold text-slate-950">
                  {formatMoney(balance.available)}
                </p>
                <p className="text-sm text-slate-500">{formatMoney(balance.pending)}</p>
                <p className="text-sm text-slate-600">{balance.activeWallets}</p>
                <p className="text-sm text-slate-600">{balance.postedToday}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

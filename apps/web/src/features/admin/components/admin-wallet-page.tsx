import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { adminWalletSnapshots } from '@/features/admin/data/admin-preview-data';
import { formatDate, formatMoney, toTitleCase } from '@/lib/formatters';

export function AdminWalletPage(): JSX.Element {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Wallets
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Wallet registry
            </h1>
          </div>
          <div className="text-sm text-slate-500">
            {adminWalletSnapshots.length} wallets in active operator view
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="Active wallets" value={String(adminWalletSnapshots.length)} />
          <MetricCard label="Currencies" value="USD, EUR, VND" />
          <MetricCard label="Exceptions" value="1 review queue" />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
          <div className="grid grid-cols-[minmax(0,1.1fr)_140px_140px_160px_120px] gap-3 border-b border-slate-200 bg-[#f4efe7] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            <span>Wallet</span>
            <span>Available</span>
            <span>Pending</span>
            <span>Last movement</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-200/80 bg-white">
            {adminWalletSnapshots.map((wallet) => (
              <div
                className="grid grid-cols-[minmax(0,1.1fr)_140px_140px_160px_120px] gap-3 px-4 py-3"
                key={wallet.walletId}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{wallet.customerName}</p>
                  <p className="truncate text-xs text-slate-500">{wallet.walletId}</p>
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {formatMoney(wallet.available)}
                </p>
                <p className="text-sm text-slate-500">{formatMoney(wallet.pending)}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(wallet.lastMovementAt, {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                  })}
                </p>
                <div>
                  <Badge tone={wallet.status === 'active' ? 'positive' : 'warning'}>
                    {toTitleCase(wallet.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#fcfaf6] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

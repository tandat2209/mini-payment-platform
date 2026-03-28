import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminWalletItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, formatMoney, shortenIdentifier, toTitleCase } from '@/lib/formatters';

export function AdminWalletPage({
  error,
  isLoading,
  wallets,
}: {
  error: string | null;
  isLoading: boolean;
  wallets: AdminWalletItem[];
}): JSX.Element {
  return (
    <AdminPageShell
      description="Review customers, wallet lifecycle, and multi-currency balances without flattening the wallet model."
      eyebrow="Customers"
      title="Customer wallets"
    >
      <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5">
          <div className="text-sm text-slate-500">
            {isLoading
              ? 'Loading customer wallets...'
              : `${wallets.length} wallets in operator view`}
          </div>

          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
            <div className="divide-y divide-slate-200/80 bg-white">
              {isLoading ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading wallet registry...
                </div>
              ) : wallets.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  No wallets are available for this admin view.
                </div>
              ) : (
                wallets.map((wallet) => (
                  <div
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_140px]"
                    key={wallet.wallet.id}
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-slate-950">
                          {wallet.wallet.label ?? wallet.customer.externalRef}
                        </p>
                        <Badge tone={wallet.status === 'active' ? 'positive' : 'warning'}>
                          {toTitleCase(wallet.status)}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-slate-600">
                        {wallet.customer.externalRef}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Wallet {shortenIdentifier(wallet.wallet.id)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {wallet.balances.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-slate-200 bg-[#fcfaf6] px-3 py-3 text-sm text-slate-500 sm:col-span-2">
                          No posted balances yet.
                        </div>
                      ) : (
                        wallet.balances.map((balance) => (
                          <div
                            className="rounded-[18px] border border-slate-200 bg-[#fcfaf6] px-3 py-3"
                            key={`${wallet.wallet.id}-${balance.currency}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {balance.currency}
                              </p>
                              <Badge tone="default">{balance.currency}</Badge>
                            </div>
                            <p className="mt-2 text-base font-semibold text-slate-950">
                              {formatMoney(balance.available)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Pending {formatMoney(balance.pending)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Last movement
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-900">
                        {wallet.lastMovementAt
                          ? formatDate(wallet.lastMovementAt, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                            })
                          : 'No movement yet'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

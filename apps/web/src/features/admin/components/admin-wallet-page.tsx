import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminWalletItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, formatMoney, shortenIdentifier, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminWalletPage({
  error,
  isLoading,
  onOpenPayouts,
  onOpenTransactions,
  wallets,
}: {
  error: string | null;
  isLoading: boolean;
  onOpenPayouts: (query: string) => void;
  onOpenTransactions: (query: string) => void;
  wallets: AdminWalletItem[];
}): JSX.Element {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const selectedWallet = useMemo(
    () => wallets.find((wallet) => wallet.wallet.id === selectedWalletId) ?? null,
    [selectedWalletId, wallets],
  );

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
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f4efe7] text-left">
                  <tr>
                    {['Customer', 'Wallet', 'Balances', 'Last movement', 'Status'].map((header) => (
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
                        Loading wallet registry...
                      </td>
                    </tr>
                  ) : wallets.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        No wallets are available for this admin view.
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet) => (
                      <tr
                        className={cn(
                          'cursor-pointer transition hover:bg-slate-50',
                          selectedWalletId === wallet.wallet.id && 'bg-emerald-50/50',
                        )}
                        key={wallet.wallet.id}
                        onClick={() =>
                          setSelectedWalletId((current) =>
                            current === wallet.wallet.id ? null : wallet.wallet.id,
                          )
                        }
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">
                              {wallet.customer.externalRef}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {wallet.wallet.label ?? 'No label'}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {shortenIdentifier(wallet.wallet.id)}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            {wallet.balances.length === 0 ? (
                              <span className="text-sm text-slate-500">No balances</span>
                            ) : (
                              wallet.balances.map((balance) => (
                                <Badge
                                  key={`${wallet.wallet.id}-${balance.currency}`}
                                  tone="default"
                                >
                                  {balance.currency} {formatMoney(balance.available)}
                                </Badge>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {wallet.lastMovementAt
                            ? formatDate(wallet.lastMovementAt, {
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                              })
                            : 'No movement yet'}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge tone={wallet.status === 'active' ? 'positive' : 'warning'}>
                            {toTitleCase(wallet.status)}
                          </Badge>
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
        onOpenChange={(open) => !open && setSelectedWalletId(null)}
        open={selectedWallet !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Customer
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedWallet?.customer.externalRef ?? 'Wallet detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedWallet ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard
                      label="Wallet"
                      value={shortenIdentifier(selectedWallet.wallet.id)}
                    />
                    <DetailCard label="Status" value={toTitleCase(selectedWallet.status)} />
                    <DetailCard
                      label="Opened"
                      value={
                        selectedWallet.openedAt
                          ? formatDate(selectedWallet.openedAt, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Unknown'
                      }
                    />
                    <DetailCard
                      label="Last movement"
                      value={
                        selectedWallet.lastMovementAt
                          ? formatDate(selectedWallet.lastMovementAt, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                            })
                          : 'No movement yet'
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Balances
                    </p>
                    {selectedWallet.balances.length === 0 ? (
                      <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
                        No posted balances yet.
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedWallet.balances.map((balance) => (
                          <div
                            className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                            key={`${selectedWallet.wallet.id}-${balance.currency}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {balance.currency}
                              </p>
                              <Badge tone="default">{balance.currency}</Badge>
                            </div>
                            <p className="mt-3 text-lg font-semibold text-slate-950">
                              {formatMoney(balance.available)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Pending {formatMoney(balance.pending)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Related pages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="rounded-full"
                        onClick={() => onOpenTransactions(selectedWallet.customer.externalRef)}
                        type="button"
                        variant="outline"
                      >
                        Transactions
                      </Button>
                      <Button
                        className="rounded-full"
                        onClick={() => onOpenPayouts(selectedWallet.customer.externalRef)}
                        type="button"
                        variant="outline"
                      >
                        Payouts
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

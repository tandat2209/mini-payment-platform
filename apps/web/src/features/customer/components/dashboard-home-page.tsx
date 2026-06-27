import type { UseQueryResult } from '@tanstack/react-query';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Euro,
  Plus,
  PoundSterling,
  Search,
  Send,
  Wallet,
} from 'lucide-react';
import type { CSSProperties, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import type {
  TransactionDetailItem,
  TransactionItem,
  TransactionListResponse,
  WalletBalance,
} from '@/features/customer/api';
import {
  formatMoney,
  formatSignedTransactionMoney,
  getCurrencyChipClasses,
  getCurrencyFlag,
  transactionFilters,
} from '@/features/customer/lib/utils';
import type { CurrencyFilter, TransactionFilter } from '@/features/customer/store/dashboard-store';
import { cn } from '@/lib/utils';

import { EmptyState, LoadingBlock } from './shared';
import { TransactionDetailPanel } from './transaction-detail-panel';
import { TransactionRow } from './transaction-row';

export function DashboardHomePage({
  availableCurrencies,
  filteredTransactions,
  onAddMoney,
  onStartPayout,
  onCurrencyFilterChange,
  onTransactionDetailClose,
  onTransactionSelect,
  onTransactionFilterChange,
  onTransactionSearchQueryChange,
  resolvedCurrencyFilter,
  selectedTransactionId,
  transactionDetailQuery,
  transactionFilter,
  transactionSearchQuery,
  transactionsQuery,
  visibleBalances,
}: {
  availableCurrencies: string[];
  filteredTransactions: TransactionItem[];
  onAddMoney: () => void;
  onStartPayout: () => void;
  onCurrencyFilterChange: (currency: CurrencyFilter) => void;
  onTransactionDetailClose: () => void;
  onTransactionSelect: (transactionId: string) => void;
  onTransactionFilterChange: (filter: TransactionFilter) => void;
  onTransactionSearchQueryChange: (query: string) => void;
  resolvedCurrencyFilter: CurrencyFilter;
  selectedTransactionId: string | null;
  transactionDetailQuery: UseQueryResult<TransactionDetailItem, Error>;
  transactionFilter: TransactionFilter;
  transactionSearchQuery: string;
  transactionsQuery: UseQueryResult<TransactionListResponse, Error>;
  visibleBalances: WalletBalance[];
}): JSX.Element {
  const primaryBalance = visibleBalances[0];
  const inflowCount = filteredTransactions.filter(
    (transaction) => transaction.direction === 'credit',
  ).length;
  const outflowCount = filteredTransactions.filter(
    (transaction) => transaction.direction === 'debit',
  ).length;
  const activityPercent =
    filteredTransactions.length > 0
      ? Math.round((inflowCount / filteredTransactions.length) * 100)
      : 0;
  const latestTransaction = filteredTransactions[0];

  return (
    <>
      <section className="space-y-5" id="section-overview">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#9da8ca]">Hi Nanas,</p>
            <h1 className="mt-1 text-[2.15rem] font-extrabold leading-tight tracking-[-0.055em] text-[#171b26] sm:text-5xl">
              Welcome to Mini-pay
            </h1>
          </div>

          <label className="hidden h-13 min-w-[330px] items-center gap-3 rounded-full bg-white px-5 text-[#9da8ca] shadow-[0_18px_46px_rgba(37,87,255,0.08)] ring-1 ring-white/80 transition focus-within:ring-[#bfc9ff] lg:flex">
            <Search className="h-5 w-5" />
            <input
              aria-label="Search transactions"
              className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-[#b3bddb]"
              onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
              placeholder="Search"
              type="search"
              value={transactionSearchQuery}
            />
          </label>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {visibleBalances.length > 0 ? (
                visibleBalances.map((balance) => (
                  <BalanceStatCard balance={balance} key={balance.currency} />
                ))
              ) : (
                <div className="rounded-[28px] border border-dashed border-[#dfe5ff] bg-white/82 p-5 text-sm font-semibold text-[#8f9bc3] shadow-[0_18px_50px_rgba(37,87,255,0.06)] md:col-span-3">
                  No wallet balances yet
                </div>
              )}
            </div>

            <Card className="overflow-hidden rounded-[34px] border-0 bg-white shadow-[0_24px_70px_rgba(37,87,255,0.10)]">
              <CardContent className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
                <div className="relative z-10 space-y-5">
                  <div className="space-y-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#a6b0d2]">
                      Universal wallet
                    </p>
                    <h2 className="max-w-sm text-3xl font-extrabold leading-tight tracking-[-0.045em] text-[#171b26] sm:text-4xl">
                      Reach financial goals faster
                    </h2>
                    <p className="max-w-md text-sm font-medium leading-6 text-[#9aa6ca]">
                      Check balances, add funds, and send payouts from one clean payment workspace.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      className="min-h-12 rounded-full border-transparent bg-[#2557ff] px-6 text-white shadow-[0_16px_34px_rgba(37,87,255,0.24)] hover:bg-[#173fe6]"
                      onClick={onAddMoney}
                      variant="default"
                    >
                      <Plus className="h-4 w-4" />
                      Add money
                    </Button>
                    <Button
                      className="min-h-12 rounded-full border-[#dfe5ff] bg-[#f7f9ff] px-6 text-[#173184] hover:bg-[#eef2ff] hover:text-[#173184]"
                      onClick={onStartPayout}
                      variant="outline"
                    >
                      <Send className="h-4 w-4" />
                      Send payout
                    </Button>
                  </div>
                </div>

                <div className="relative min-h-[190px]">
                  <div className="absolute inset-x-7 top-4 h-40 rounded-[30px] bg-[#d8def7] opacity-70" />
                  <div className="absolute inset-x-4 top-2 h-44 rounded-[30px] bg-[#c7d0f4] opacity-75" />
                  <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#8f9bff_0%,#2557ff_100%)] p-6 text-white shadow-[0_24px_48px_rgba(37,87,255,0.22)]">
                    <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/18" />
                    <div className="absolute right-8 top-5 flex -space-x-2">
                      <span className="h-6 w-6 rounded-full bg-white/32" />
                      <span className="h-6 w-6 rounded-full bg-white/46" />
                    </div>
                    <div className="relative space-y-8">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-extrabold text-white/82">Mini-pay Card</span>
                        <CreditCard className="h-5 w-5 text-white/80" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/72">Available balance</p>
                        <p className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">
                          {primaryBalance ? formatMoney(primaryBalance.available) : '$0.00'}
                        </p>
                      </div>
                      <div className="flex items-end justify-between gap-3 text-xs font-bold text-white/78">
                        <span>{primaryBalance?.currency ?? 'USD'} Wallet</span>
                        <span>12/26</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden rounded-[34px] border-0 bg-white shadow-[0_24px_70px_rgba(37,87,255,0.10)]">
            <CardContent className="space-y-7 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#a6b0d2]">
                    Recent activity
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] text-[#171b26]">
                    Flow overview
                  </h2>
                </div>
                <span className="rounded-2xl bg-[#eef2ff] p-3 text-[#2557ff]">
                  <Activity className="h-5 w-5" />
                </span>
              </div>

              <div
                className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-[conic-gradient(#2557ff_var(--activity-progress),#e9edff_0)] p-4 [--activity-progress:0%]"
                style={{ '--activity-progress': `${activityPercent}%` } as CSSProperties}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-white text-center shadow-inner shadow-[#dfe5ff]/70">
                  <div>
                    <p className="text-4xl font-extrabold tracking-[-0.05em] text-[#173184]">
                      {activityPercent}%
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#a6b0d2]">
                      Inflow
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniMetric label="Total" value={String(filteredTransactions.length)} />
                <MiniMetric label="In" value={String(inflowCount)} />
                <MiniMetric label="Out" value={String(outflowCount)} />
              </div>

              <div className="rounded-[24px] bg-[#f7f9ff] p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#a6b0d2]">
                  Latest movement
                </p>
                {latestTransaction ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-2xl',
                          latestTransaction.direction === 'credit'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-600',
                        )}
                      >
                        {latestTransaction.direction === 'credit' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[#171b26]">
                          {latestTransaction.description.split(':')[0]?.trim() ||
                            latestTransaction.type}
                        </p>
                        <p className="text-xs font-semibold text-[#9aa6ca]">
                          {latestTransaction.currency}
                        </p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        'shrink-0 text-sm font-extrabold',
                        latestTransaction.direction === 'credit'
                          ? 'text-emerald-700'
                          : 'text-rose-600',
                      )}
                    >
                      {formatSignedTransactionMoney(latestTransaction)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-medium text-[#9aa6ca]">No recent movement yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4" id="section-transactions">
        <Card className="rounded-[34px] border-0 bg-white/96 shadow-[0_24px_70px_rgba(37,87,255,0.09)]">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-[#171b26]">
                  Recent transactions
                </h2>
                <p className="mt-1 text-sm font-medium text-[#9aa6ca]">
                  Review money movement across your active currencies.
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#f1f4ff] px-3.5 py-1.5 text-sm font-extrabold text-[#2557ff]">
                {filteredTransactions.length} shown
              </span>
            </div>

            <div className="grid gap-3 lg:hidden">
              <label className="flex h-12 items-center gap-3 rounded-full border border-[#dfe5ff] bg-[#f7f9ff] px-4 text-[#9da8ca] ring-[#c7d0ff]/70 transition focus-within:ring-2">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Search transactions"
                  className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-[#b3bddb]"
                  onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
                  placeholder="Search transactions"
                  type="search"
                  value={transactionSearchQuery}
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-[28px] bg-[#f8faff] p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#a6b0d2]">
                  Direction
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {transactionFilters.map((filter) => (
                    <Button
                      className={cn(
                        'h-10 rounded-full px-4 shadow-none',
                        transactionFilter === filter.value
                          ? 'border-[#2557ff] bg-[#2557ff] text-white hover:bg-[#173fe6]'
                          : 'border-[#dfe5ff] bg-white text-[#7f8bb2] hover:bg-[#eef2ff] hover:text-[#173184]',
                      )}
                      key={filter.value}
                      onClick={() => onTransactionFilterChange(filter.value)}
                      variant={transactionFilter === filter.value ? 'default' : 'outline'}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 lg:text-right">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#a6b0d2]">
                  Currency
                </p>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <button
                    className={cn(
                      'rounded-full border px-3.5 py-2 text-sm font-extrabold transition-colors',
                      getCurrencyChipClasses('all', resolvedCurrencyFilter === 'all'),
                    )}
                    onClick={() => onCurrencyFilterChange('all')}
                    type="button"
                  >
                    All currencies
                  </button>
                  {availableCurrencies.map((currency) => (
                    <button
                      className={cn(
                        'rounded-full border px-3.5 py-2 text-sm font-extrabold transition-colors',
                        getCurrencyChipClasses(currency, resolvedCurrencyFilter === currency),
                      )}
                      key={currency}
                      onClick={() => onCurrencyFilterChange(currency)}
                      type="button"
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {transactionsQuery.isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {transactionsQuery.error instanceof Error
                  ? transactionsQuery.error.message
                  : 'Transaction feed unavailable'}
              </div>
            ) : null}

            {transactionsQuery.isLoading && filteredTransactions.length === 0 ? (
              <div className="space-y-3">
                <LoadingBlock className="h-24" />
                <LoadingBlock className="h-24" />
                <LoadingBlock className="h-24" />
              </div>
            ) : null}

            {filteredTransactions.length > 0 ? (
              <div className="space-y-2.5">
                <div className="hidden rounded-[20px] border border-[#dfe5ff] bg-[#f7f9ff] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8f9bc3] md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px]">
                  <span>Transaction</span>
                  <span>Currency</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Date</span>
                  <span className="text-right">Status</span>
                </div>
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    isSelected={selectedTransactionId === transaction.id}
                    key={transaction.id}
                    onSelect={onTransactionSelect}
                    transaction={transaction}
                  />
                ))}
              </div>
            ) : null}

            {!transactionsQuery.isLoading &&
            !transactionsQuery.isError &&
            filteredTransactions.length === 0 ? (
              <EmptyState
                message="Try another currency, direction, or search term."
                title="No transactions"
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      {selectedTransactionId !== null ? (
        <TransactionDetailPanel
          onClose={onTransactionDetailClose}
          query={transactionDetailQuery}
          selectedTransaction={
            filteredTransactions.find((transaction) => transaction.id === selectedTransactionId) ??
            null
          }
          selectedTransactionId={selectedTransactionId}
        />
      ) : null}
    </>
  );
}

function BalanceStatCard({ balance }: { balance: WalletBalance }): JSX.Element {
  return (
    <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(37,87,255,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-2xl bg-[#eef2ff] p-2.5 text-[#6679ff]">
          <CurrencyIcon currency={balance.currency} />
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-[#9aa6ca]">{balance.currency}</span>
          <CountryFlag
            className="h-4 w-6 rounded-sm"
            countryCode={getCurrencyFlag(balance.currency)}
          />
        </div>
      </div>
      <p className="mt-5 text-2xl font-extrabold tracking-[-0.05em] text-[#171b26]">
        {formatMoney(balance.available)}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-[#9aa6ca]">
        Pending <span className="text-[#657196]">{formatMoney(balance.pending)}</span>
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[20px] bg-[#f7f9ff] px-3 py-3 text-center">
      <p className="text-xl font-extrabold tracking-[-0.04em] text-[#171b26]">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a6b0d2]">
        {label}
      </p>
    </div>
  );
}

function CurrencyIcon({ currency }: { currency: string }): JSX.Element {
  switch (currency) {
    case 'USD':
      return <DollarSign className="h-5 w-5" />;
    case 'EUR':
      return <Euro className="h-5 w-5" />;
    case 'GBP':
      return <PoundSterling className="h-5 w-5" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
}

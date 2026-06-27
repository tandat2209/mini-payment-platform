import type { UseQueryResult } from '@tanstack/react-query';
import { Activity, AlertCircle, Clock3, Plus, Search, Send } from 'lucide-react';
import type { JSX } from 'react';

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
  formatUsdAmount,
  getCurrencyChipClasses,
  getCurrencyFlag,
  sumBalanceUsdEquivalent,
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
  const availableEstimate = sumBalanceUsdEquivalent(visibleBalances, 'available');
  const pendingEstimate = sumBalanceUsdEquivalent(visibleBalances, 'pending');
  const totalEstimate = availableEstimate + pendingEstimate;
  const inMotionTransactions = filteredTransactions.filter(isTransactionInMotion);
  const attentionTransactions = filteredTransactions.filter(isTransactionNeedsAttention);
  const latestTransaction = filteredTransactions[0];

  return (
    <>
      <section className="space-y-5" id="section-overview">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-muted-foreground-soft">Hi Dat Nguyen,</p>
            <h1 className="mt-1 text-[2.15rem] font-extrabold leading-tight tracking-[-0.055em] text-foreground sm:text-5xl">
              Welcome to Mini-pay
            </h1>
          </div>

          <label className="hidden h-13 min-w-[330px] items-center gap-3 rounded-full bg-surface px-5 text-muted-foreground-soft shadow-search ring-1 ring-surface/80 transition focus-within:ring-primary-border-strong lg:flex">
            <Search className="h-5 w-5" />
            <input
              aria-label="Search transactions"
              className="w-full border-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-placeholder"
              onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
              placeholder="Search"
              type="search"
              value={transactionSearchQuery}
            />
          </label>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
          <Card className="overflow-hidden rounded-[34px] border-0 bg-surface shadow-primary-soft">
            <CardContent className="space-y-6 p-5 sm:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground-subtle">
                    Estimated total balance
                  </p>
                  <p className="mt-3 text-5xl font-extrabold tracking-[-0.07em] text-foreground sm:text-6xl">
                    {formatUsdAmount(totalEstimate)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Button
                    className="min-h-12 rounded-full border-transparent bg-primary px-6 text-primary-foreground shadow-primary-button hover:bg-primary-hover"
                    onClick={onAddMoney}
                    variant="default"
                  >
                    <Plus className="h-4 w-4" />
                    Add money
                  </Button>
                  <Button
                    className="min-h-12 rounded-full border-primary-border bg-primary-surface px-6 text-foreground-accent hover:bg-primary-muted hover:text-foreground-accent"
                    onClick={onStartPayout}
                    variant="outline"
                  >
                    <Send className="h-4 w-4" />
                    Send payout
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SimpleMetric label="Available" value={formatUsdAmount(availableEstimate)} />
                <SimpleMetric label="Pending" value={formatUsdAmount(pendingEstimate)} />
              </div>

              <div className="flex flex-wrap gap-3">
                {visibleBalances.length > 0 ? (
                  visibleBalances.map((balance) => (
                    <BalanceWalletPill balance={balance} key={balance.currency} />
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-primary-border bg-primary-surface px-4 py-2 text-sm font-bold text-muted-foreground-strong">
                    No wallet balances yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[34px] border-0 bg-surface shadow-primary-soft">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground-subtle">
                    Money in motion
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] text-foreground">
                    Today
                  </h2>
                </div>
                <span className="rounded-2xl bg-primary-muted p-3 text-primary">
                  <Activity className="h-5 w-5" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MotionCount
                  icon={AlertCircle}
                  label="Attention"
                  tone={attentionTransactions.length > 0 ? 'danger' : 'success'}
                  value={String(attentionTransactions.length)}
                />
                <MotionCount
                  icon={Clock3}
                  label="Processing"
                  tone="primary"
                  value={String(inMotionTransactions.length)}
                />
              </div>

              {latestTransaction ? (
                <div className="rounded-[24px] bg-primary-surface p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground-subtle">
                    Latest
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-foreground">
                        {getTransactionListTitle(latestTransaction.description)}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {latestTransaction.currency}
                      </p>
                    </div>
                    <p
                      className={cn(
                        'shrink-0 text-sm font-extrabold',
                        latestTransaction.direction === 'credit' ? 'text-success' : 'text-danger',
                      )}
                    >
                      {formatSignedTransactionMoney(latestTransaction)}
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4" id="section-transactions">
        <Card className="rounded-[34px] border-0 bg-surface/96 shadow-primary-soft">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-[-0.045em] text-foreground">
                  Recent transactions
                </h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Search and inspect wallet movements.
                </p>
              </div>
              <span className="w-fit rounded-full bg-surface-muted px-3.5 py-1.5 text-sm font-extrabold text-primary">
                {filteredTransactions.length} shown
              </span>
            </div>

            <div className="grid gap-3 lg:hidden">
              <label className="flex h-12 items-center gap-3 rounded-full border border-primary-border bg-primary-surface px-4 text-muted-foreground-soft ring-primary-border-strong/70 transition focus-within:ring-2">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Search transactions"
                  className="w-full border-0 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-placeholder"
                  onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
                  placeholder="Search transactions"
                  type="search"
                  value={transactionSearchQuery}
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-[28px] bg-primary-surface-strong p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground-subtle">
                  Direction
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {transactionFilters.map((filter) => (
                    <Button
                      className={cn(
                        'h-10 rounded-full px-4 shadow-none',
                        transactionFilter === filter.value
                          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                          : 'border-primary-border bg-surface text-muted-foreground-chip hover:bg-primary-muted hover:text-foreground-accent',
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
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground-subtle">
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
              <div className="rounded-2xl border border-danger-muted bg-danger-surface px-4 py-3 text-sm text-danger">
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
                <div className="hidden rounded-[20px] border border-primary-border bg-primary-surface px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground-strong md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px]">
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

function BalanceWalletPill({ balance }: { balance: WalletBalance }): JSX.Element {
  return (
    <div className="flex min-w-[180px] items-center justify-between gap-4 rounded-full border border-primary-border bg-primary-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <CountryFlag
          className="h-4 w-6 rounded-sm"
          countryCode={getCurrencyFlag(balance.currency)}
        />
        <span className="text-sm font-extrabold text-foreground">{balance.currency}</span>
      </div>
      <span className="text-sm font-extrabold text-primary">{formatMoney(balance.available)}</span>
    </div>
  );
}

function SimpleMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[22px] bg-primary-surface px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground-subtle">
        {label}
      </p>
      <p className="mt-1 text-xl font-extrabold tracking-[-0.04em] text-foreground">{value}</p>
    </div>
  );
}

function MotionCount({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof AlertCircle;
  label: string;
  tone: 'danger' | 'primary' | 'success';
  value: string;
}): JSX.Element {
  const toneClasses = {
    danger: 'bg-danger-surface text-danger',
    primary: 'bg-primary-muted text-primary',
    success: 'bg-success-surface text-success',
  }[tone];

  return (
    <div className="rounded-[22px] bg-primary-surface p-4">
      <span className={cn('grid h-9 w-9 place-items-center rounded-2xl', toneClasses)}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-3xl font-extrabold tracking-[-0.05em] text-foreground">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground-subtle">
        {label}
      </p>
    </div>
  );
}

function isTransactionInMotion(transaction: TransactionItem): boolean {
  const normalizedStatus = transaction.status.toLowerCase();

  return ['pending', 'processing', 'submitted'].some((status) => normalizedStatus.includes(status));
}

function isTransactionNeedsAttention(transaction: TransactionItem): boolean {
  const normalizedStatus = transaction.status.toLowerCase();

  return ['failed', 'returned', 'rejected', 'cancelled', 'canceled'].some((status) =>
    normalizedStatus.includes(status),
  );
}

function getTransactionListTitle(description: string): string {
  const [primaryPart] = description.split(':');
  const normalizedPrimaryPart = primaryPart?.trim();

  if (normalizedPrimaryPart && normalizedPrimaryPart.length > 0) {
    return normalizedPrimaryPart;
  }

  return description;
}

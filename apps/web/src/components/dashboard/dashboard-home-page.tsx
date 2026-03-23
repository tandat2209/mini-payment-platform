import type { UseQueryResult } from '@tanstack/react-query';
import { Plus, Search, Send, Wallet } from 'lucide-react';
import type { JSX } from 'react';

import type {
  TransactionDetailItem,
  TransactionItem,
  TransactionListResponse,
  WalletBalance,
} from '../../api';
import { cn } from '../../lib/utils';
import type { CurrencyFilter, TransactionFilter } from '../../store/dashboard-store';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { EmptyState, LoadingBlock, SectionHeader, SummaryFigure } from './shared';
import { TransactionDetailPanel } from './transaction-detail-panel';
import { TransactionRow } from './transaction-row';
import {
  formatMoney,
  formatUsdAmount,
  formatUsdRate,
  getCurrencyChipClasses,
  getCurrencyFlag,
  getCurrencyIcon,
  getUsdEquivalentFromMoney,
  type SummaryMetric,
  transactionFilters,
} from './utils';

export function DashboardHomePage({
  availableCurrencies,
  filteredTransactions,
  metrics,
  onAddMoney,
  onStartPayout,
  onCurrencyFilterChange,
  onTransactionDetailClose,
  onTransactionSelect,
  onTransactionFilterChange,
  onTransactionSearchQueryChange,
  resolvedCurrencyFilter,
  selectedTransactionId,
  totalBalanceUsdEquivalent,
  transactionDetailQuery,
  transactionFilter,
  transactionSearchQuery,
  transactionsQuery,
  visibleBalances,
}: {
  availableCurrencies: string[];
  filteredTransactions: TransactionItem[];
  metrics: SummaryMetric[];
  onAddMoney: () => void;
  onStartPayout: () => void;
  onCurrencyFilterChange: (currency: CurrencyFilter) => void;
  onTransactionDetailClose: () => void;
  onTransactionSelect: (transactionId: string) => void;
  onTransactionFilterChange: (filter: TransactionFilter) => void;
  onTransactionSearchQueryChange: (query: string) => void;
  resolvedCurrencyFilter: CurrencyFilter;
  selectedTransactionId: string | null;
  totalBalanceUsdEquivalent: string;
  transactionDetailQuery: UseQueryResult<TransactionDetailItem, Error>;
  transactionFilter: TransactionFilter;
  transactionSearchQuery: string;
  transactionsQuery: UseQueryResult<TransactionListResponse, Error>;
  visibleBalances: WalletBalance[];
}): JSX.Element {
  return (
    <>
      <section className="space-y-5" id="section-overview">
        <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[1.75fr_repeat(3,1fr)] lg:items-end">
              <div className="space-y-3 lg:pr-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Total balance
                </p>
                <p className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  {totalBalanceUsdEquivalent}
                </p>
                <p className="text-sm text-slate-500">USD equivalent across wallet balances</p>
              </div>

              {metrics.map((metric) => (
                <SummaryFigure
                  key={metric.label}
                  label={metric.label}
                  note={metric.note}
                  tone={metric.tone}
                  value={metric.value}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#eee7dd] pt-5">
              {visibleBalances.length > 0 ? (
                visibleBalances.map((balance) => {
                  const CurrencyIcon = getCurrencyIcon(balance.currency);

                  return (
                    <div
                      className="min-w-[188px] flex-1 rounded-[24px] border border-[#e7e1d8] bg-[#fcfaf6] p-4"
                      key={balance.currency}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {balance.currency}
                          </span>
                          <span className="text-lg leading-none">
                            {getCurrencyFlag(balance.currency)}
                          </span>
                        </div>
                        <CurrencyIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                        {formatMoney(balance.available)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        ~ {formatUsdAmount(getUsdEquivalentFromMoney(balance.available))} (Rate:{' '}
                        {formatUsdRate(balance.currency)})
                      </p>
                      <p className="mt-3 text-sm text-slate-500">
                        Pending:{' '}
                        <span className="font-medium text-slate-700">
                          {formatMoney(balance.pending)}
                        </span>
                      </p>
                    </div>
                  );
                })
              ) : (
                <span className="text-sm text-slate-500">No wallet balances yet</span>
              )}

              <button
                className="flex min-w-[188px] flex-1 items-center justify-center rounded-[24px] border border-dashed border-[#d9d1c5] bg-[#faf7f2] p-4 text-left text-slate-600"
                type="button"
              >
                <div className="flex flex-col items-start gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Add new currency</span>
                  <span className="text-sm text-slate-500">Open another balance pocket</span>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-[#eee7dd] pt-4">
              <Button className="rounded-xl px-4" onClick={onAddMoney} variant="default">
                <Plus className="h-4 w-4" />
                Add money
              </Button>
              <Button className="rounded-xl px-4" onClick={onStartPayout} variant="outline">
                <Send className="h-4 w-4" />
                Payout
              </Button>
              <Button className="rounded-xl px-4" variant="outline">
                <Wallet className="h-4 w-4" />
                Exchange
              </Button>
              <Button className="rounded-xl px-4" variant="outline">
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5" id="section-transactions">
        <Card className="rounded-[30px] border-white/70 bg-white/88 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-4 p-4">
            <SectionHeader
              action={`${filteredTransactions.length} shown`}
              title="Recent transactions"
            />

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-3 text-slate-500">
                <Search className="h-4 w-4" />
                <input
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
                  placeholder="Search transaction reference or description"
                  type="search"
                  value={transactionSearchQuery}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {transactionFilters.map((filter) => (
                  <Button
                    className="h-9 rounded-full px-4"
                    key={filter.value}
                    onClick={() => onTransactionFilterChange(filter.value)}
                    variant={transactionFilter === filter.value ? 'default' : 'outline'}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium',
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
                    'rounded-full border px-3 py-1.5 text-sm font-medium',
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

            {transactionsQuery.isError ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
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
                <div className="hidden rounded-[20px] border border-slate-200 bg-[#faf7f2] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px]">
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

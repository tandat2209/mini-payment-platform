import type { UseQueryResult } from '@tanstack/react-query';
import { Plus, Search, Send } from 'lucide-react';
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
  getCurrencyChipClasses,
  getCurrencyFlag,
  getCurrencyIcon,
  transactionFilters,
} from '@/features/customer/lib/utils';
import type { CurrencyFilter, TransactionFilter } from '@/features/customer/store/dashboard-store';
import { cn } from '@/lib/utils';

import { EmptyState, LoadingBlock, SectionHeader } from './shared';
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
  return (
    <>
      <section className="space-y-4" id="section-overview">
        <Card className="rounded-[26px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2.5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Wallet
                </p>
                <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Move money
                </h1>
                <p className="max-w-xl text-sm text-slate-500">
                  Check balances, add funds, or start a payout.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[#eee7dd] pt-4">
                <Button className="min-h-11 rounded-xl px-4" onClick={onAddMoney} variant="default">
                  <Plus className="h-4 w-4" />
                  Add money
                </Button>
                <Button
                  className="min-h-11 rounded-xl px-4"
                  onClick={onStartPayout}
                  variant="outline"
                >
                  <Send className="h-4 w-4" />
                  Payout
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#eee7dd] pt-4">
              {visibleBalances.length > 0 ? (
                visibleBalances.map((balance) => {
                  const CurrencyIcon = getCurrencyIcon(balance.currency);

                  return (
                    <div
                      className="min-w-[168px] flex-1 rounded-[22px] border border-[#e7e1d8] bg-[#fcfaf6] p-3.5"
                      key={balance.currency}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {balance.currency}
                          </span>
                          <CountryFlag
                            className="h-4 w-6 rounded-sm"
                            countryCode={getCurrencyFlag(balance.currency)}
                          />
                        </div>
                        <CurrencyIcon className="h-4 w-4 text-slate-400" />
                      </div>
                      <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                        {formatMoney(balance.available)}
                      </p>
                      <p className="mt-1.5 text-sm text-slate-500">
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
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4" id="section-transactions">
        <Card className="rounded-[26px] border-white/70 bg-white/88 shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-4 p-4">
            <SectionHeader
              action={`${filteredTransactions.length} shown`}
              title="Recent transactions"
            />

            <div className="grid gap-3">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-slate-500">
                <Search className="h-4 w-4" />
                <input
                  className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => onTransactionSearchQueryChange(event.target.value)}
                  placeholder="Search transactions"
                  type="search"
                  value={transactionSearchQuery}
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {transactionFilters.map((filter) => (
                  <Button
                    className="h-9 rounded-full px-3.5"
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
                <div className="hidden rounded-[18px] border border-slate-200 bg-[#faf7f2] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px]">
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

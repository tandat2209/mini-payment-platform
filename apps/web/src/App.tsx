import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Euro,
  LayoutGrid,
  Plus,
  PoundSterling,
  Search,
  Send,
  Settings,
  Wallet,
} from 'lucide-react';
import type { JSX } from 'react';
import { useDeferredValue, useMemo } from 'react';

import { type MoneyDto, type TransactionItem, type WalletBalance } from './api';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { useBalancesQuery, useTransactionsQuery } from './hooks/use-dashboard-queries';
import { cn } from './lib/utils';
import {
  type ActiveSection,
  type CurrencyFilter,
  type TransactionFilter,
  useDashboardStore,
} from './store/dashboard-store';

type NavItem = {
  icon: LucideIcon;
  label: ActiveSection;
};

type SectionHeaderProps = {
  action?: string;
  title: string;
};

type SummaryFigureProps = {
  label: string;
  note: string;
  tone: 'blue' | 'emerald' | 'amber' | 'slate';
  value: string;
};

type TransactionRowProps = {
  transaction: TransactionItem;
};

const navigationItems: NavItem[] = [
  { icon: LayoutGrid, label: 'Overview' },
  { icon: CreditCard, label: 'Transactions' },
  { icon: Settings, label: 'Settings' },
];

const transactionFilters: Array<{ label: string; value: TransactionFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Inflow', value: 'credit' },
  { label: 'Outflow', value: 'debit' },
];
const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
const dashboardRenderTimestamp = Date.now();
const placeholderUsdRates: Record<string, number> = {
  AUD: 0.65,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  SGD: 0.74,
  USD: 1,
  VND: 0.000039,
};
const currencyFlags: Record<string, string> = {
  AUD: 'AU',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  SGD: 'SG',
  USD: 'US',
  VND: 'VN',
};

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatMoneyFromMinor(amountMinor: bigint, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number(amountMinor) / 100);
}

function formatMoney(money: MoneyDto): string {
  return formatMoneyFromMinor(BigInt(money.amountMinor), money.currency);
}

function formatUsdAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(amount);
}

function formatSignedTransactionMoney(item: TransactionItem): string {
  const amountMinor = BigInt(item.amounts.net.amountMinor);
  const signedMinor = item.direction === 'debit' ? -amountMinor : amountMinor;

  return formatMoneyFromMinor(signedMinor, item.amounts.net.currency);
}

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) {
    return 'Waiting for sync';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    ...options,
  }).format(new Date(value));
}

function shortenIdentifier(value: string): string {
  return value.length <= 14 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function getToneFromStatus(value: string): 'default' | 'positive' | 'warning' {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue.includes('ok') ||
    normalizedValue.includes('active') ||
    normalizedValue.includes('completed')
  ) {
    return 'positive';
  }

  if (normalizedValue.includes('pending') || normalizedValue.includes('limited')) {
    return 'warning';
  }

  return 'default';
}

function getCurrencyIcon(currency: string): LucideIcon {
  switch (currency) {
    case 'USD':
      return DollarSign;
    case 'EUR':
      return Euro;
    case 'GBP':
      return PoundSterling;
    default:
      return Wallet;
  }
}

function getCurrencyFlag(currency: string): string {
  return currencyFlags[currency] ?? currency.slice(0, 2);
}

function getPlaceholderUsdRate(currency: string): number {
  return placeholderUsdRates[currency] ?? 1;
}

function getAmountFromMinor(amountMinor: string): number {
  return Number(amountMinor) / 100;
}

function getUsdEquivalentFromMoney(money: MoneyDto): number {
  return getAmountFromMinor(money.amountMinor) * getPlaceholderUsdRate(money.currency);
}

function formatUsdRate(currency: string): string {
  const usdRate = getPlaceholderUsdRate(currency);
  const digits = usdRate < 0.01 ? 4 : 2;

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    style: 'currency',
  }).format(usdRate);
}

function includesSearchMatch(values: Array<string | null | undefined>, query: string): boolean {
  if (query.length === 0) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(query));
}

function getCurrencyChipClasses(currency: string, isActive: boolean): string {
  if (currency === 'all') {
    return isActive
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-700';
  }

  if (currency === 'USD') {
    return isActive
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-white text-slate-700';
  }

  if (currency === 'EUR') {
    return isActive
      ? 'border-sky-300 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-white text-slate-700';
  }

  return isActive
    ? 'border-slate-300 bg-slate-100 text-slate-900'
    : 'border-slate-200 bg-white text-slate-700';
}

function getAvailableCurrencies(
  balances: WalletBalance[],
  transactions: TransactionItem[],
): string[] {
  return [
    ...new Set([
      ...balances.map((balance) => balance.currency),
      ...transactions.map((transaction) => transaction.currency),
    ]),
  ].sort((left, right) => left.localeCompare(right));
}

function sumBalanceUsdEquivalent(
  balances: WalletBalance[],
  field: 'available' | 'pending',
): number {
  return balances.reduce((sum, balance) => sum + getUsdEquivalentFromMoney(balance[field]), 0);
}

function getTransactionTimestamp(transaction: TransactionItem): number | null {
  const timestamp = transaction.postedAt ?? transaction.occurredAt;

  if (!timestamp) {
    return null;
  }

  const milliseconds = new Date(timestamp).getTime();

  return Number.isNaN(milliseconds) ? null : milliseconds;
}

function sumTransactionsUsdEquivalent(
  transactions: TransactionItem[],
  direction: 'credit' | 'debit',
  windowStartTimestamp: number,
): number {
  return transactions.reduce((sum, transaction) => {
    const transactionTimestamp = getTransactionTimestamp(transaction);

    if (
      transaction.direction !== direction ||
      transactionTimestamp === null ||
      transactionTimestamp < windowStartTimestamp
    ) {
      return sum;
    }

    return sum + getUsdEquivalentFromMoney(transaction.amounts.net);
  }, 0);
}

function SummaryFigure({ label, note, tone, value }: SummaryFigureProps): JSX.Element {
  return (
    <div
      className={cn(
        'space-y-1 px-0 py-1 lg:border-l lg:pl-7',
        tone === 'blue' && 'lg:border-l-emerald-100',
        tone === 'emerald' && 'lg:border-l-emerald-100',
        tone === 'amber' && 'lg:border-l-amber-100',
        tone === 'slate' && 'lg:border-l-slate-200',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          'text-2xl font-semibold tracking-tight',
          tone === 'emerald' && 'text-emerald-700',
          tone === 'blue' && 'text-emerald-700',
          tone === 'amber' && 'text-amber-700',
          tone === 'slate' && 'text-slate-950',
        )}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

function SectionHeader({ action, title }: SectionHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {action ? <span className="text-sm font-medium text-slate-500">{action}</span> : null}
    </div>
  );
}

function LoadingBlock({ className }: { className?: string }): JSX.Element {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />;
}

function EmptyState({ message, title }: { message: string; title: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function TransactionRow({ transaction }: TransactionRowProps): JSX.Element {
  return (
    <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3 md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px] md:items-center">
      <div className="min-w-0 md:pr-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-2xl',
              transaction.direction === 'credit' ? 'bg-emerald-50' : 'bg-red-50',
            )}
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {transaction.description}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500">
              {toTitleCase(transaction.type)} ·{' '}
              {transaction.reference ?? shortenIdentifier(transaction.id)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        <span>{transaction.currency}</span>
      </div>

      <div className="text-left md:text-right">
        <p
          className={cn(
            'text-sm font-semibold',
            transaction.direction === 'credit' ? 'text-emerald-700' : 'text-slate-950',
          )}
        >
          {formatSignedTransactionMoney(transaction)}
        </p>
        <p className="mt-1 text-xs text-slate-500 md:hidden">
          {toTitleCase(transaction.direction)}
        </p>
      </div>

      <div className="text-sm text-slate-500 md:text-right">
        <p>
          {formatDate(transaction.postedAt ?? transaction.occurredAt, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex md:justify-end">
        <Badge tone={getToneFromStatus(transaction.status)}>
          {toTitleCase(transaction.status)}
        </Badge>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  const activeSection = useDashboardStore((state) => state.activeSection);
  const currencyFilter = useDashboardStore((state) => state.currencyFilter);
  const transactionFilter = useDashboardStore((state) => state.transactionFilter);
  const transactionSearchQuery = useDashboardStore((state) => state.transactionSearchQuery);
  const setActiveSection = useDashboardStore((state) => state.setActiveSection);
  const setCurrencyFilter = useDashboardStore((state) => state.setCurrencyFilter);
  const setTransactionFilter = useDashboardStore((state) => state.setTransactionFilter);
  const setTransactionSearchQuery = useDashboardStore((state) => state.setTransactionSearchQuery);

  const balancesQuery = useBalancesQuery();
  const transactionsQuery = useTransactionsQuery(12);

  const balanceItems = balancesQuery.data?.balances;
  const transactionItems = transactionsQuery.data?.items;
  const deferredTransactionSearchQuery = useDeferredValue(
    transactionSearchQuery.trim().toLowerCase(),
  );

  const availableCurrencies = useMemo(
    () => getAvailableCurrencies(balanceItems ?? [], transactionItems ?? []),
    [balanceItems, transactionItems],
  );
  const resolvedCurrencyFilter =
    currencyFilter === 'all' || availableCurrencies.includes(currencyFilter)
      ? currencyFilter
      : 'all';
  const visibleBalances = balanceItems ?? [];
  const last30DaysStartTimestamp = dashboardRenderTimestamp - thirtyDaysInMilliseconds;

  const filteredTransactions = useMemo(
    () =>
      (transactionItems ?? []).filter((transaction) => {
        const matchesCurrency =
          resolvedCurrencyFilter === 'all' ? true : transaction.currency === resolvedCurrencyFilter;
        const matchesSearch = includesSearchMatch(
          [
            transaction.description,
            transaction.reference,
            transaction.currency,
            transaction.type,
            transaction.status,
          ],
          deferredTransactionSearchQuery,
        );
        const matchesDirection =
          transactionFilter === 'all' ? true : transaction.direction === transactionFilter;

        return matchesCurrency && matchesSearch && matchesDirection;
      }),
    [deferredTransactionSearchQuery, resolvedCurrencyFilter, transactionFilter, transactionItems],
  );

  const totalBalanceUsdEquivalent = formatUsdAmount(
    sumBalanceUsdEquivalent(balanceItems ?? [], 'available'),
  );
  const totalPendingUsdEquivalent = formatUsdAmount(
    sumBalanceUsdEquivalent(balanceItems ?? [], 'pending'),
  );
  const totalInflowUsdEquivalent = formatUsdAmount(
    sumTransactionsUsdEquivalent(transactionItems ?? [], 'credit', last30DaysStartTimestamp),
  );
  const totalOutflowUsdEquivalent = formatUsdAmount(
    sumTransactionsUsdEquivalent(transactionItems ?? [], 'debit', last30DaysStartTimestamp),
  );

  const metrics: SummaryFigureProps[] = [
    {
      label: 'Inflow (30d)',
      note: 'USD equivalent · placeholder FX',
      tone: 'blue',
      value: totalInflowUsdEquivalent,
    },
    {
      label: 'Outflow (30d)',
      note: 'USD equivalent · placeholder FX',
      tone: 'amber',
      value: totalOutflowUsdEquivalent,
    },
    {
      label: 'Pending',
      note: 'USD equivalent · placeholder FX',
      tone: 'slate',
      value: totalPendingUsdEquivalent,
    },
  ];

  function handleSectionSelect(section: ActiveSection): void {
    setActiveSection(section);

    const sectionId = `section-${section.toLowerCase()}`;
    globalThis.document?.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function handleCurrencyFilterChange(nextCurrency: CurrencyFilter): void {
    setCurrencyFilter(nextCurrency);
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border border-[#e7e1d8] bg-[#faf7f2]/95 p-5 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur">
            <div className="flex items-center gap-3">
              <p className="text-[36px] leading-none text-slate-950 [font-family:var(--font-display)]">
                Pay
              </p>
            </div>

            <nav className="mt-10 space-y-1" aria-label="Primary">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeSection;

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:bg-white/80 hover:text-slate-950',
                    )}
                    key={item.label}
                    onClick={() => handleSectionSelect(item.label)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="space-y-5 py-2">
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
                      <p className="text-sm text-slate-500">
                        USD equivalent across wallet balances
                      </p>
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
                              ~ {formatUsdAmount(getUsdEquivalentFromMoney(balance.available))}{' '}
                              (Rate: {formatUsdRate(balance.currency)})
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
                    <Button className="rounded-xl px-4" variant="default">
                      <Plus className="h-4 w-4" />
                      Add money
                    </Button>
                    <Button className="rounded-xl px-4" variant="outline">
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
              <Card
                className={cn(
                  'rounded-[30px] border-white/70 bg-white/88 shadow-[0_10px_40px_rgba(15,23,42,0.04)]',
                  activeSection === 'Transactions' && 'ring-2 ring-emerald-200',
                )}
              >
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
                        onChange={(event) => setTransactionSearchQuery(event.target.value)}
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
                          onClick={() => setTransactionFilter(filter.value)}
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
                      onClick={() => handleCurrencyFilterChange('all')}
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
                        onClick={() => handleCurrencyFilterChange(currency)}
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
                        <TransactionRow key={transaction.id} transaction={transaction} />
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

            <nav
              aria-label="Mobile navigation"
              className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden"
            >
              {navigationItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeSection;

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500',
                    )}
                    key={item.label}
                    onClick={() => handleSectionSelect(item.label)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Download,
  Euro,
  FileText,
  Landmark,
  LayoutGrid,
  Plus,
  PoundSterling,
  Search,
  Send,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import type { Dispatch, JSX, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import {
  fetchBalances,
  fetchRecipients,
  fetchStatementOverview,
  fetchTransactions,
  getCustomerExternalRef,
  type MoneyDto,
  type RecipientSummary,
  type StatementOverviewData,
  type TransactionItem,
  type WalletBalancesResponse,
} from './api';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { cn } from './lib/utils';

type QueryState<T> = {
  data: T | null;
  error: string | null;
  status: 'error' | 'loading' | 'ready';
};

type NavItem = {
  icon: LucideIcon;
  label: string;
};

type OverviewMetric = {
  label: string;
  note: string | undefined;
  tone: 'blue' | 'emerald' | 'amber' | 'violet';
  value: string;
};

type MetricCardProps = OverviewMetric;

type SectionHeaderProps = {
  action?: string;
  title: string;
};

type TransactionRowProps = {
  transaction: TransactionItem;
};

const navigationItems: NavItem[] = [
  { icon: LayoutGrid, label: 'Overview' },
  { icon: Wallet, label: 'Balances' },
  { icon: CreditCard, label: 'Transactions' },
  { icon: Users, label: 'Recipients' },
  { icon: FileText, label: 'Statements' },
  { icon: Settings, label: 'Settings' },
];

function createInitialState<T>(): QueryState<T> {
  return {
    data: null,
    error: null,
    status: 'loading',
  };
}

function getErrorMessage(caughtError: unknown): string {
  return caughtError instanceof Error ? caughtError.message : 'Unknown error';
}

function deriveCustomerLabel(externalRef: string): string {
  return externalRef
    .split(/[_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

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

function formatSignedTransactionMoney(item: TransactionItem): string {
  const amountMinor = BigInt(item.amounts.net.amountMinor);
  const signedMinor = item.direction === 'debit' ? -amountMinor : amountMinor;

  return formatMoneyFromMinor(signedMinor, item.amounts.net.currency);
}

function sumTransactionsByDirection(
  transactions: TransactionItem[],
  direction: 'credit' | 'debit',
  currency: string,
): MoneyDto | null {
  const matchingTransactions = transactions.filter(
    (transaction) => transaction.direction === direction && transaction.currency === currency,
  );

  if (matchingTransactions.length === 0) {
    return null;
  }

  const total = matchingTransactions.reduce(
    (sum, transaction) => sum + BigInt(transaction.amounts.net.amountMinor),
    0n,
  );

  return {
    amountMinor: total.toString(),
    currency,
  };
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

function formatMonthYear(month: number, year: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function shortenIdentifier(value: string): string {
  return value.length <= 14 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function getToneFromStatus(value: string): 'default' | 'positive' | 'warning' {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue.includes('ok') ||
    normalizedValue.includes('active') ||
    normalizedValue.includes('completed') ||
    normalizedValue.includes('live')
  ) {
    return 'positive';
  }

  if (normalizedValue.includes('pending') || normalizedValue.includes('limited')) {
    return 'warning';
  }

  return 'default';
}

function getDirectionTone(direction: string): 'default' | 'positive' | 'warning' {
  return direction === 'credit' ? 'positive' : direction === 'debit' ? 'warning' : 'default';
}

function getInitials(name: string): string {
  return name
    .split(/\s+/u)
    .map((segment) => segment[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
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

async function loadSection<T>(
  loader: () => Promise<T>,
  setState: Dispatch<SetStateAction<QueryState<T>>>,
  isCancelled: () => boolean,
): Promise<void> {
  setState((currentState) => ({
    data: currentState.data,
    error: null,
    status: 'loading',
  }));

  try {
    const data = await loader();

    if (isCancelled()) {
      return;
    }

    setState({
      data,
      error: null,
      status: 'ready',
    });
  } catch (caughtError) {
    if (isCancelled()) {
      return;
    }

    setState((currentState) => ({
      data: currentState.data,
      error: getErrorMessage(caughtError),
      status: currentState.data ? 'ready' : 'error',
    }));
  }
}

function MetricCard({ label, note, tone, value }: MetricCardProps): JSX.Element {
  return (
    <Card
      className={cn(
        'rounded-2xl border bg-white shadow-none',
        tone === 'blue' && 'border-l-4 border-l-sky-500',
        tone === 'emerald' && 'border-l-4 border-l-emerald-500',
        tone === 'amber' && 'border-l-4 border-l-amber-500',
        tone === 'violet' && 'border-l-4 border-l-indigo-500',
      )}
    >
      <CardContent className="space-y-1.5 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
        {note ? <p className="text-xs text-slate-500">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ action, title }: SectionHeaderProps): JSX.Element {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      </div>
      {action ? <span className="text-sm font-medium text-slate-500">{action}</span> : null}
    </div>
  );
}

function LoadingBlock({ className }: { className?: string }): JSX.Element {
  return <div className={cn('animate-pulse rounded-xl bg-slate-100', className)} />;
}

function EmptyState({ message, title }: { message: string; title: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function TransactionRow({ transaction }: TransactionRowProps): JSX.Element {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              transaction.direction === 'credit' ? 'bg-emerald-50' : 'bg-amber-50',
            )}
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-amber-700" />
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

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={getToneFromStatus(transaction.status)}>
          {toTitleCase(transaction.status)}
        </Badge>
        <Badge tone={getDirectionTone(transaction.direction)}>
          {toTitleCase(transaction.direction)}
        </Badge>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-sm font-semibold text-slate-950">
          {formatSignedTransactionMoney(transaction)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(transaction.postedAt ?? transaction.occurredAt)}
        </p>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  const customerExternalRef = getCustomerExternalRef();
  const customerLabel = deriveCustomerLabel(customerExternalRef);
  const [reloadToken, setReloadToken] = useState(0);
  const [balancesState, setBalancesState] =
    useState<QueryState<WalletBalancesResponse>>(createInitialState);
  const [transactionsState, setTransactionsState] =
    useState<QueryState<{ items: TransactionItem[] }>>(createInitialState);
  const [recipientsState, setRecipientsState] =
    useState<QueryState<{ items: RecipientSummary[] }>>(createInitialState);
  const [statementsState, setStatementsState] =
    useState<QueryState<StatementOverviewData>>(createInitialState);

  useEffect(() => {
    let cancelled = false;

    const isCancelled = (): boolean => cancelled;

    void Promise.allSettled([
      loadSection(fetchBalances, setBalancesState, isCancelled),
      loadSection(
        async (): Promise<{ items: TransactionItem[] }> => {
          const response = await fetchTransactions(8);

          return {
            items: response.items,
          };
        },
        setTransactionsState,
        isCancelled,
      ),
      loadSection(fetchRecipients, setRecipientsState, isCancelled),
      loadSection(fetchStatementOverview, setStatementsState, isCancelled),
    ]);

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const balances = balancesState.data?.balances ?? [];
  const transactions = transactionsState.data?.items ?? [];
  const recipients = recipientsState.data?.items ?? [];
  const statementPeriods = statementsState.data?.items ?? [];
  const latestStatement = statementsState.data?.latestDetail;
  const latestStatementPeriod = statementsState.data?.latestPeriod;
  const primaryBalance =
    balances.find((balance) => balance.currency === 'USD') ?? balances[0] ?? null;
  const inflow = primaryBalance
    ? sumTransactionsByDirection(transactions, 'credit', primaryBalance.currency)
    : null;
  const outflow = primaryBalance
    ? sumTransactionsByDirection(transactions, 'debit', primaryBalance.currency)
    : null;

  const metrics: OverviewMetric[] = [
    {
      label: 'Available',
      note: primaryBalance ? primaryBalance.currency : undefined,
      tone: 'emerald',
      value: primaryBalance ? formatMoney(primaryBalance.available) : '--',
    },
    {
      label: 'Pending',
      note: primaryBalance ? primaryBalance.currency : undefined,
      tone: 'amber',
      value: primaryBalance ? formatMoney(primaryBalance.pending) : '--',
    },
    {
      label: 'Inflow',
      note: 'Latest activity',
      tone: 'blue',
      value: inflow ? formatMoney(inflow) : '--',
    },
    {
      label: 'Outflow',
      note: 'Latest activity',
      tone: 'violet',
      value: outflow ? formatMoney(outflow) : '--',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[28px] border border-slate-200 bg-white/95 p-5 text-slate-900 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="mt-1 text-lg font-semibold text-slate-950">Aster Pay</p>
              </div>
            </div>

            <nav className="mt-8 space-y-1" aria-label="Primary">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === 'Overview';

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                    )}
                    key={item.label}
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
            <header className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overview</p>
                </div>
                <label className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 text-slate-500 lg:max-w-md">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    placeholder="Search"
                    type="search"
                  />
                </label>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {getInitials(customerLabel)}
                  </div>
                  <Button
                    className="h-10 rounded-xl px-3"
                    onClick={() => setReloadToken((currentValue) => currentValue + 1)}
                    variant="ghost"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </header>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <Card className="overflow-hidden rounded-[28px] border-slate-200 bg-white">
                <div className="h-1.5 w-full bg-emerald-500" />
                <CardContent className="space-y-6 p-4 sm:p-5">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-500">Total balance</p>
                      <p className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                        {primaryBalance ? formatMoney(primaryBalance.available) : '--'}
                      </p>
                      {balances.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {balances.map((balance) => {
                            const CurrencyIcon = getCurrencyIcon(balance.currency);

                            return (
                              <div
                                className={cn(
                                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
                                  balance.currency === 'USD' &&
                                    'border-emerald-200 bg-emerald-50/60',
                                  balance.currency === 'EUR' && 'border-sky-200 bg-sky-50/60',
                                  balance.currency !== 'USD' &&
                                    balance.currency !== 'EUR' &&
                                    'border-slate-200 bg-slate-50',
                                )}
                                key={balance.currency}
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                                  <CurrencyIcon className="h-3.5 w-3.5 text-slate-700" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {balance.currency}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-2.5 sm:grid-cols-3 lg:w-[340px] lg:grid-cols-1">
                      <Button className="justify-start rounded-2xl py-3" variant="default">
                        <Plus className="h-4 w-4" />
                        Add money
                      </Button>
                      <Button className="justify-start rounded-2xl py-3" variant="secondary">
                        <Send className="h-4 w-4" />
                        Send payout
                      </Button>
                      <Button className="justify-start rounded-2xl py-3" variant="secondary">
                        <Download className="h-4 w-4" />
                        Download statement
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                      <MetricCard
                        key={metric.label}
                        label={metric.label}
                        note={metric.note}
                        tone={metric.tone}
                        value={metric.value}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-slate-200 bg-white/95">
                <CardContent className="space-y-3 p-4">
                  <SectionHeader title="Balances" />

                  {balancesState.status === 'loading' && balances.length === 0 ? (
                    <div className="space-y-3">
                      <LoadingBlock className="h-20" />
                      <LoadingBlock className="h-20" />
                    </div>
                  ) : null}

                  {balances.length > 0 ? (
                    <div className="space-y-3">
                      {balances.map((balance) => (
                        <div
                          className={cn(
                            'rounded-2xl border p-3.5',
                            balance.currency === 'USD' && 'border-emerald-200 bg-emerald-50/40',
                            balance.currency === 'EUR' && 'border-sky-200 bg-sky-50/40',
                            balance.currency !== 'USD' &&
                              balance.currency !== 'EUR' &&
                              'border-slate-200 bg-slate-50',
                          )}
                          key={`${balance.currency}-${balance.updatedAt}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                                {(() => {
                                  const CurrencyIcon = getCurrencyIcon(balance.currency);

                                  return <CurrencyIcon className="h-4 w-4 text-slate-700" />;
                                })()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-500">
                                  {balance.currency}
                                </p>
                                <p className="mt-1 text-xl font-semibold text-slate-950">
                                  {formatMoney(balance.available)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Pending</p>
                              <p className="mt-1 text-xl font-semibold text-slate-950">
                                {formatMoney(balance.pending)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {balancesState.status === 'error' && balances.length === 0 ? (
                    <EmptyState
                      message={balancesState.error ?? 'Balance feed unavailable'}
                      title="Unable to load balances"
                    />
                  ) : null}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <Card className="rounded-[28px] border-slate-200 bg-white">
                <CardContent className="p-4">
                  <SectionHeader title="Recent transactions" />

                  {transactionsState.error ? (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      {transactionsState.error}
                    </div>
                  ) : null}

                  {transactionsState.status === 'loading' && transactions.length === 0 ? (
                    <div className="space-y-3">
                      <LoadingBlock className="h-24" />
                      <LoadingBlock className="h-24" />
                      <LoadingBlock className="h-24" />
                    </div>
                  ) : null}

                  {transactions.length > 0 ? (
                    <div className="space-y-2.5">
                      {transactions.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} />
                      ))}
                    </div>
                  ) : null}

                  {transactionsState.status === 'error' && transactions.length === 0 ? (
                    <EmptyState
                      message={transactionsState.error ?? 'Transaction feed unavailable'}
                      title="Recent transactions"
                    />
                  ) : null}
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="rounded-[28px] border-slate-200 bg-white">
                  <CardContent className="p-4">
                    <SectionHeader title="Recipients" />

                    {recipientsState.error ? (
                      <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {recipientsState.error}
                      </div>
                    ) : null}

                    {recipientsState.status === 'loading' && recipients.length === 0 ? (
                      <div className="space-y-3">
                        <LoadingBlock className="h-20" />
                        <LoadingBlock className="h-20" />
                      </div>
                    ) : null}

                    {recipients.length > 0 ? (
                      <div className="space-y-2.5">
                        {recipients.map((recipient) => (
                          <div
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
                            key={recipient.id}
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                              {getInitials(recipient.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {recipient.name}
                                </p>
                                <Badge tone={getToneFromStatus(recipient.status)}>
                                  {toTitleCase(recipient.status)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {recipient.rails
                                  .map(
                                    (rail) =>
                                      `${toTitleCase(rail.rail)}${rail.currency ? ` · ${rail.currency}` : ''}`,
                                  )
                                  .join(' · ')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {recipientsState.status === 'error' && recipients.length === 0 ? (
                      <EmptyState
                        message={recipientsState.error ?? 'Recipients unavailable'}
                        title="Recipients"
                      />
                    ) : null}
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-slate-200 bg-white">
                  <CardContent className="p-4">
                    <SectionHeader title="Statements" />

                    {latestStatementPeriod ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="mt-1 text-lg font-semibold text-slate-950">
                              {formatMonthYear(
                                latestStatementPeriod.month,
                                latestStatementPeriod.year,
                              )}
                            </p>
                          </div>
                          <Badge tone="default">{latestStatementPeriod.currency}</Badge>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-sm text-slate-500">Closing</p>
                            <p className="mt-1 text-sm font-semibold text-slate-950">
                              {latestStatement ? formatMoney(latestStatement.closingBalance) : '--'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {statementPeriods.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {statementPeriods.slice(0, 3).map((period) => (
                          <div
                            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3"
                            key={`${period.walletId}-${period.currency}-${period.year}-${period.month}`}
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {formatMonthYear(period.month, period.year)}
                              </p>
                              <p className="text-sm text-slate-500">
                                {period.currency} · {shortenIdentifier(period.walletId)}
                              </p>
                            </div>
                            <FileText className="h-4 w-4 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {statementsState.error ? (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {statementsState.error}
                      </div>
                    ) : null}

                    {statementsState.status === 'loading' && statementPeriods.length === 0 ? (
                      <div className="space-y-3">
                        <LoadingBlock className="h-20" />
                        <LoadingBlock className="h-14" />
                      </div>
                    ) : null}

                    {statementsState.status === 'error' && statementPeriods.length === 0 ? (
                      <div className="mt-4">
                        <EmptyState
                          message={statementsState.error ?? 'Statements unavailable'}
                          title="Statements"
                        />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </section>

            <nav
              aria-label="Mobile navigation"
              className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden"
            >
              {navigationItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = item.label === 'Overview';

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
                      isActive ? 'bg-slate-950 text-white' : 'text-slate-500',
                    )}
                    key={item.label}
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

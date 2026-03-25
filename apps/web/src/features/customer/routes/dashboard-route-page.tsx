import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useDeferredValue, useMemo, useState } from 'react';

import {
  useBalancesQuery,
  useTransactionDetailQuery,
  useTransactionsQuery,
} from '@/features/customer/api/use-customer-queries';
import { DashboardHomePage } from '@/features/customer/components/dashboard-home-page';
import {
  formatUsdAmount,
  getAvailableCurrencies,
  includesSearchMatch,
  sumBalanceUsdEquivalent,
  type SummaryMetric,
  sumTransactionsUsdEquivalent,
} from '@/features/customer/lib/utils';
import { type CurrencyFilter, useDashboardStore } from '@/features/customer/store/dashboard-store';

const thirtyDaysInMilliseconds = 30 * 24 * 60 * 60 * 1000;
const dashboardRenderTimestamp = Date.now();

export function DashboardRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const currencyFilter = useDashboardStore((state) => state.currencyFilter);
  const transactionFilter = useDashboardStore((state) => state.transactionFilter);
  const transactionSearchQuery = useDashboardStore((state) => state.transactionSearchQuery);
  const setCurrencyFilter = useDashboardStore((state) => state.setCurrencyFilter);
  const setTransactionFilter = useDashboardStore((state) => state.setTransactionFilter);
  const setTransactionSearchQuery = useDashboardStore((state) => state.setTransactionSearchQuery);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

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
  const resolvedSelectedTransactionId = filteredTransactions.some(
    (transaction) => transaction.id === selectedTransactionId,
  )
    ? selectedTransactionId
    : null;
  const transactionDetailQuery = useTransactionDetailQuery(resolvedSelectedTransactionId);

  function handleTransactionSelect(transactionId: string): void {
    setSelectedTransactionId((currentTransactionId) =>
      currentTransactionId === transactionId ? null : transactionId,
    );
  }

  const metrics: SummaryMetric[] = [
    {
      label: 'Inflow (30d)',
      note: 'USD equivalent · placeholder FX',
      tone: 'blue',
      value: formatUsdAmount(
        sumTransactionsUsdEquivalent(transactionItems ?? [], 'credit', last30DaysStartTimestamp),
      ),
    },
    {
      label: 'Outflow (30d)',
      note: 'USD equivalent · placeholder FX',
      tone: 'amber',
      value: formatUsdAmount(
        sumTransactionsUsdEquivalent(transactionItems ?? [], 'debit', last30DaysStartTimestamp),
      ),
    },
    {
      label: 'Pending',
      note: 'USD equivalent · placeholder FX',
      tone: 'slate',
      value: formatUsdAmount(sumBalanceUsdEquivalent(balanceItems ?? [], 'pending')),
    },
  ];

  function handleCurrencyFilterChange(nextCurrency: CurrencyFilter): void {
    setCurrencyFilter(nextCurrency);
  }

  return (
    <DashboardHomePage
      availableCurrencies={availableCurrencies}
      filteredTransactions={filteredTransactions}
      metrics={metrics}
      onAddMoney={() => {
        void navigate({ to: '/funding-details' });
      }}
      onStartPayout={() => {
        void navigate({ to: '/payout' });
      }}
      onCurrencyFilterChange={handleCurrencyFilterChange}
      onTransactionDetailClose={() => {
        setSelectedTransactionId(null);
      }}
      onTransactionSelect={handleTransactionSelect}
      onTransactionFilterChange={setTransactionFilter}
      onTransactionSearchQueryChange={setTransactionSearchQuery}
      resolvedCurrencyFilter={resolvedCurrencyFilter}
      selectedTransactionId={resolvedSelectedTransactionId}
      totalBalanceUsdEquivalent={formatUsdAmount(
        sumBalanceUsdEquivalent(balanceItems ?? [], 'available'),
      )}
      transactionDetailQuery={transactionDetailQuery}
      transactionFilter={transactionFilter}
      transactionSearchQuery={transactionSearchQuery}
      transactionsQuery={transactionsQuery}
      visibleBalances={visibleBalances}
    />
  );
}

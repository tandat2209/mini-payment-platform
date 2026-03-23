import type { JSX } from 'react';
import { useDeferredValue, useMemo } from 'react';

import { useAdminStore } from '../../store/admin-store';
import { includesSearchMatch } from '../dashboard/utils';
import { AdminTransactionsPanel } from './admin-transactions-panel';

export function AdminTransactionsRoutePage(): JSX.Element {
  const selectedTransactionId = useAdminStore((state) => state.selectedTransactionId);
  const setSelectedTransactionId = useAdminStore((state) => state.setSelectedTransactionId);
  const setTransactionSearchQuery = useAdminStore((state) => state.setTransactionSearchQuery);
  const setTransactionTypeFilter = useAdminStore((state) => state.setTransactionTypeFilter);
  const transactionSearchQuery = useAdminStore((state) => state.transactionSearchQuery);
  const transactions = useAdminStore((state) => state.transactions);
  const transactionTypeFilter = useAdminStore((state) => state.transactionTypeFilter);

  const deferredTransactionSearchQuery = useDeferredValue(
    transactionSearchQuery.trim().toLowerCase(),
  );
  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesType =
          transactionTypeFilter === 'all' ? true : transaction.type === transactionTypeFilter;
        const matchesSearch = includesSearchMatch(
          [
            transaction.customerExternalRef,
            transaction.customerName,
            transaction.description,
            transaction.reference,
            transaction.type,
          ],
          deferredTransactionSearchQuery,
        );

        return matchesType && matchesSearch;
      }),
    [deferredTransactionSearchQuery, transactionTypeFilter, transactions],
  );

  const selectedTransaction =
    filteredTransactions.find((transaction) => transaction.id === selectedTransactionId) ?? null;

  return (
    <AdminTransactionsPanel
      onClose={() => {
        setSelectedTransactionId(null);
      }}
      onSearchChange={setTransactionSearchQuery}
      onSelect={(transactionId) => {
        setSelectedTransactionId(selectedTransactionId === transactionId ? null : transactionId);
      }}
      onTypeFilterChange={setTransactionTypeFilter}
      searchQuery={transactionSearchQuery}
      selectedTransaction={selectedTransaction}
      selectedTransactionId={selectedTransactionId}
      transactions={filteredTransactions}
      typeFilter={transactionTypeFilter}
    />
  );
}

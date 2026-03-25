import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { startTransition, useDeferredValue, useMemo, useState } from 'react';

import {
  useAdminTransactionDetailQuery,
  useAdminTransactionsQuery,
} from '@/hooks/use-admin-queries';

import { AdminTransactionsPanel } from './admin-transactions-panel';

const PAGE_SIZE = 20;

export function AdminTransactionsRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/transactions' });
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'funding' | 'payout'>('all');
  const selectedTransactionId = search.transactionId ?? null;
  const currentCursor = cursorStack.at(-1) ?? null;
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const transactionQueryInput = useMemo(
    () => ({
      cursor: currentCursor,
      limit: PAGE_SIZE,
      ...(deferredSearchQuery.length > 0 ? { query: deferredSearchQuery } : {}),
      ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    }),
    [currentCursor, deferredSearchQuery, typeFilter],
  );
  const transactionsQuery = useAdminTransactionsQuery(transactionQueryInput);
  const transactionDetailQuery = useAdminTransactionDetailQuery(selectedTransactionId);
  const selectedTransaction = useMemo(() => {
    const selectedListItem =
      transactionsQuery.data?.items.find(
        (transaction) => transaction.id === selectedTransactionId,
      ) ?? null;

    return transactionDetailQuery.data ?? selectedListItem;
  }, [selectedTransactionId, transactionDetailQuery.data, transactionsQuery.data?.items]);

  return (
    <AdminTransactionsPanel
      canNextPage={(transactionsQuery.data?.page.nextCursor ?? null) !== null}
      canPreviousPage={cursorStack.length > 1}
      detailError={transactionDetailQuery.error?.message ?? null}
      detailLoading={transactionDetailQuery.isLoading}
      error={transactionsQuery.error?.message ?? null}
      isLoading={transactionsQuery.isLoading}
      onClose={() => {
        void navigate({
          search: (previous) => ({
            ...previous,
            transactionId: undefined,
          }),
          to: '/admin/transactions',
        });
      }}
      onNextPage={() => {
        const nextCursor = transactionsQuery.data?.page.nextCursor ?? null;

        if (!nextCursor) {
          return;
        }

        startTransition(() => {
          setCursorStack((previous) => [...previous, nextCursor]);
          void navigate({
            search: (previous) => ({
              ...previous,
              transactionId: undefined,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      onPreviousPage={() => {
        if (cursorStack.length <= 1) {
          return;
        }

        startTransition(() => {
          setCursorStack((previous) => previous.slice(0, -1));
          void navigate({
            search: (previous) => ({
              ...previous,
              transactionId: undefined,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      onSearchChange={(query) => {
        startTransition(() => {
          setSearchQuery(query);
          setCursorStack([null]);
          void navigate({
            search: (previous) => ({
              ...previous,
              transactionId: undefined,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      onOpenLedger={(ledgerTransactionId) => {
        void navigate({
          search: {
            ledgerTransactionId,
          },
          to: '/admin/ledgers',
        });
      }}
      onSelect={(transactionId) => {
        void navigate({
          search: (previous) => ({
            ...previous,
            transactionId: previous.transactionId === transactionId ? undefined : transactionId,
          }),
          to: '/admin/transactions',
        });
      }}
      onTypeFilterChange={(filter) => {
        startTransition(() => {
          setTypeFilter(filter);
          setCursorStack([null]);
          void navigate({
            search: (previous) => ({
              ...previous,
              transactionId: undefined,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      pageIndex={cursorStack.length}
      searchQuery={searchQuery}
      selectedTransaction={selectedTransaction}
      selectedTransactionId={selectedTransactionId}
      transactions={transactionsQuery.data?.items ?? []}
      typeFilter={typeFilter}
    />
  );
}

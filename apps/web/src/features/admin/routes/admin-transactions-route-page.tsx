import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { startTransition, useDeferredValue, useMemo, useState } from 'react';

import {
  useAdminTransactionDetailQuery,
  useAdminTransactionsQuery,
} from '@/features/admin/api/use-admin-queries';
import { AdminTransactionsPanel } from '@/features/admin/components/admin-transactions-panel';

const PAGE_SIZE = 20;
const TRANSACTION_TYPE_FILTERS = new Set(['all', 'funding', 'payout']);

export function AdminTransactionsRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/transactions' });
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const searchQuery = search.query ?? '';
  const typeFilter =
    search.type && TRANSACTION_TYPE_FILTERS.has(search.type)
      ? (search.type as 'all' | 'funding' | 'payout')
      : 'all';
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
            query: previous.query,
            transactionId: undefined,
            type: previous.type,
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
              query: previous.query,
              transactionId: undefined,
              type: previous.type,
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
              query: previous.query,
              transactionId: undefined,
              type: previous.type,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      onSearchChange={(query) => {
        startTransition(() => {
          setCursorStack([null]);
          void navigate({
            search: (previous) => ({
              query: query.length > 0 ? query : undefined,
              transactionId: undefined,
              type: previous.type,
            }),
            to: '/admin/transactions',
          });
        });
      }}
      onOpenLedger={(ledgerTransactionId) => {
        void navigate({
          search: {
            currency: undefined,
            ledgerTransactionId,
          },
          to: '/admin/ledger',
        });
      }}
      onOpenCustomers={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/customers',
        });
      }}
      onOpenPayouts={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/payouts',
        });
      }}
      onOpenReconciliation={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/reconciliation',
        });
      }}
      onSelect={(transactionId) => {
        void navigate({
          search: (previous) => ({
            query: previous.query,
            transactionId: previous.transactionId === transactionId ? undefined : transactionId,
            type: previous.type,
          }),
          to: '/admin/transactions',
        });
      }}
      onOpenWebhooks={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/webhooks',
        });
      }}
      onTypeFilterChange={(filter) => {
        startTransition(() => {
          setCursorStack([null]);
          void navigate({
            search: (previous) => ({
              query: previous.query,
              transactionId: undefined,
              type: filter === 'all' ? undefined : filter,
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

import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { startTransition, useDeferredValue, useMemo, useState } from 'react';

import {
  useAdminLedgerDetailQuery,
  useAdminLedgersQuery,
} from '@/features/admin/api/use-admin-queries';
import { AdminLedgerPanel } from '@/features/admin/components/admin-ledger-panel';

const PAGE_SIZE = 20;

export function AdminLedgersRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/ledger' });
  const [cursorStack, setCursorStack] = useState<Array<string | null>>([null]);
  const [searchQuery, setSearchQuery] = useState('');
  const currency = search.currency ?? null;
  const selectedLedgerTransactionId = search.ledgerTransactionId ?? null;
  const currentCursor = cursorStack.at(-1) ?? null;
  const deferredSearchQuery = useDeferredValue(searchQuery.trim());
  const ledgerQueryInput = useMemo(
    () => ({
      cursor: currentCursor,
      ...(currency ? { currency } : {}),
      limit: PAGE_SIZE,
      ...(deferredSearchQuery.length > 0 ? { query: deferredSearchQuery } : {}),
    }),
    [currency, currentCursor, deferredSearchQuery],
  );
  const ledgersQuery = useAdminLedgersQuery(ledgerQueryInput);
  const ledgerDetailQuery = useAdminLedgerDetailQuery(selectedLedgerTransactionId);
  const selectedLedgerTransaction = useMemo(() => {
    const selectedListItem =
      ledgersQuery.data?.items.find(
        (transaction) => transaction.id === selectedLedgerTransactionId,
      ) ?? null;

    return ledgerDetailQuery.data ?? selectedListItem;
  }, [ledgerDetailQuery.data, ledgersQuery.data?.items, selectedLedgerTransactionId]);

  return (
    <AdminLedgerPanel
      canNextPage={(ledgersQuery.data?.page.nextCursor ?? null) !== null}
      canPreviousPage={cursorStack.length > 1}
      detailError={ledgerDetailQuery.error?.message ?? null}
      detailLoading={ledgerDetailQuery.isLoading}
      error={ledgersQuery.error?.message ?? null}
      isLoading={ledgersQuery.isLoading}
      ledgerTransactions={ledgersQuery.data?.items ?? []}
      onClose={() => {
        void navigate({
          search: (previous) => ({
            currency: previous.currency,
            ledgerTransactionId: undefined,
          }),
          to: '/admin/ledger',
        });
      }}
      onNextPage={() => {
        const nextCursor = ledgersQuery.data?.page.nextCursor ?? null;

        if (!nextCursor) {
          return;
        }

        startTransition(() => {
          setCursorStack((previous) => [...previous, nextCursor]);
          void navigate({
            search: (previous) => ({
              currency: previous.currency,
              ledgerTransactionId: undefined,
            }),
            to: '/admin/ledger',
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
              currency: previous.currency,
              ledgerTransactionId: undefined,
            }),
            to: '/admin/ledger',
          });
        });
      }}
      onSearchChange={(query) => {
        startTransition(() => {
          setSearchQuery(query);
          setCursorStack([null]);
          void navigate({
            search: (previous) => ({
              currency: previous.currency,
              ledgerTransactionId: undefined,
            }),
            to: '/admin/ledger',
          });
        });
      }}
      onOpenTransaction={(transactionId) => {
        void navigate({
          search: {
            query: undefined,
            transactionId,
            type: undefined,
          },
          to: '/admin/transactions',
        });
      }}
      onSelect={(transactionId) => {
        void navigate({
          search: (previous) => ({
            currency: previous.currency,
            ledgerTransactionId:
              previous.ledgerTransactionId === transactionId ? undefined : transactionId,
          }),
          to: '/admin/ledger',
        });
      }}
      pageIndex={cursorStack.length}
      searchQuery={searchQuery}
      selectedLedgerTransaction={selectedLedgerTransaction}
      selectedLedgerTransactionEntries={ledgerDetailQuery.data?.entries ?? null}
      selectedLedgerTransactionId={selectedLedgerTransactionId}
    />
  );
}

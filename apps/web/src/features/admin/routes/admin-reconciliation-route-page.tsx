import { useNavigate } from '@tanstack/react-router';
import { useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { useAdminReconciliationExceptionsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminReconciliationPage } from '@/features/admin/components/admin-reconciliation-page';

export function AdminReconciliationRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/reconciliation' });
  const exceptionsQuery = useAdminReconciliationExceptionsQuery();
  const query = search.query?.trim().toLowerCase() ?? '';
  const filteredExceptions = useMemo(() => {
    const items = exceptionsQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((item) =>
      [
        item.kind,
        item.reference ?? '',
        item.severity,
        item.sourceId,
        item.summary,
        item.linkedLedgerTransactionId ?? '',
        item.linkedPayoutId ?? '',
        item.linkedTransactionId ?? '',
        item.linkedWebhookEventId ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [exceptionsQuery.data?.items, query]);

  return (
    <AdminReconciliationPage
      error={exceptionsQuery.error?.message ?? null}
      exceptions={filteredExceptions}
      isLoading={exceptionsQuery.isLoading}
      onOpenLedger={(ledgerTransactionId) => {
        void navigate({
          search: {
            currency: undefined,
            ledgerTransactionId,
          },
          to: '/admin/ledger',
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
      onOpenTransactions={(query) => {
        void navigate({
          search: {
            query,
            transactionId: undefined,
            type: undefined,
          },
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
    />
  );
}

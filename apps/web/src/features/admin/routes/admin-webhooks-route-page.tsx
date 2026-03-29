import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { useAdminWebhooksQuery } from '@/features/admin/api/use-admin-queries';
import { AdminWebhooksPage } from '@/features/admin/components/admin-webhooks-page';

export function AdminWebhooksRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/webhooks' });
  const webhooksQuery = useAdminWebhooksQuery();
  const query = search.query?.trim().toLowerCase() ?? '';
  const filteredEvents = useMemo(() => {
    const items = webhooksQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((event) =>
      [
        event.eventType,
        event.externalEventId,
        event.id,
        event.linkedPayoutId ?? '',
        event.linkedTransactionId ?? '',
        event.provider,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [query, webhooksQuery.data?.items]);

  return (
    <AdminWebhooksPage
      error={webhooksQuery.error?.message ?? null}
      events={filteredEvents}
      isLoading={webhooksQuery.isLoading}
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
    />
  );
}

import { useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { useAdminPayoutsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminPayoutsPage } from '@/features/admin/components/admin-payouts-page';

export function AdminPayoutsRoutePage(): JSX.Element {
  const search = useSearch({ from: '/admin/payouts' });
  const payoutsQuery = useAdminPayoutsQuery();
  const query = search.query?.trim().toLowerCase() ?? '';
  const filteredPayouts = useMemo(() => {
    const items = payoutsQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((item) =>
      [
        item.customer.externalRef,
        item.externalPayoutId ?? '',
        item.id,
        item.latestWebhookEventId ?? '',
        item.recipient.name,
        item.reference ?? '',
        item.userTransactionId,
        item.walletId,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [payoutsQuery.data?.items, query]);

  return (
    <AdminPayoutsPage
      error={payoutsQuery.error?.message ?? null}
      isLoading={payoutsQuery.isLoading}
      payouts={filteredPayouts}
    />
  );
}

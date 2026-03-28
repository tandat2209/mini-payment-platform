import type { JSX } from 'react';

import { useAdminPayoutsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminPayoutsPage } from '@/features/admin/components/admin-payouts-page';

export function AdminPayoutsRoutePage(): JSX.Element {
  const payoutsQuery = useAdminPayoutsQuery();

  return (
    <AdminPayoutsPage
      error={payoutsQuery.error?.message ?? null}
      isLoading={payoutsQuery.isLoading}
      payouts={payoutsQuery.data?.items ?? []}
    />
  );
}

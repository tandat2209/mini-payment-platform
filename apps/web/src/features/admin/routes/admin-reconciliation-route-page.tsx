import type { JSX } from 'react';

import { useAdminReconciliationExceptionsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminReconciliationPage } from '@/features/admin/components/admin-reconciliation-page';

export function AdminReconciliationRoutePage(): JSX.Element {
  const exceptionsQuery = useAdminReconciliationExceptionsQuery();

  return (
    <AdminReconciliationPage
      error={exceptionsQuery.error?.message ?? null}
      exceptions={exceptionsQuery.data?.items ?? []}
      isLoading={exceptionsQuery.isLoading}
    />
  );
}

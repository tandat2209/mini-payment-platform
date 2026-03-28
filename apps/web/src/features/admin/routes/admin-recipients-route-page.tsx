import type { JSX } from 'react';

import { useAdminRecipientsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminRecipientsPage } from '@/features/admin/components/admin-recipients-page';

export function AdminRecipientsRoutePage(): JSX.Element {
  const recipientsQuery = useAdminRecipientsQuery();

  return (
    <AdminRecipientsPage
      error={recipientsQuery.error?.message ?? null}
      isLoading={recipientsQuery.isLoading}
      recipients={recipientsQuery.data?.items ?? []}
    />
  );
}

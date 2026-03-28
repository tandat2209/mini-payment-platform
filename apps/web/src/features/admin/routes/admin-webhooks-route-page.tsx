import type { JSX } from 'react';

import { useAdminWebhooksQuery } from '@/features/admin/api/use-admin-queries';
import { AdminWebhooksPage } from '@/features/admin/components/admin-webhooks-page';

export function AdminWebhooksRoutePage(): JSX.Element {
  const webhooksQuery = useAdminWebhooksQuery();

  return (
    <AdminWebhooksPage
      error={webhooksQuery.error?.message ?? null}
      events={webhooksQuery.data?.items ?? []}
      isLoading={webhooksQuery.isLoading}
    />
  );
}

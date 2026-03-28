import type { JSX } from 'react';

import { useAdminWalletsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminWalletPage } from '@/features/admin/components/admin-wallet-page';

export function AdminWalletRoutePage(): JSX.Element {
  const walletsQuery = useAdminWalletsQuery();

  return (
    <AdminWalletPage
      error={walletsQuery.error?.message ?? null}
      isLoading={walletsQuery.isLoading}
      wallets={walletsQuery.data?.items ?? []}
    />
  );
}

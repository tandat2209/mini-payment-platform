import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import { useAdminWalletsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminWalletPage } from '@/features/admin/components/admin-wallet-page';

export function AdminWalletRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const walletsQuery = useAdminWalletsQuery();

  return (
    <AdminWalletPage
      error={walletsQuery.error?.message ?? null}
      isLoading={walletsQuery.isLoading}
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
      wallets={walletsQuery.data?.items ?? []}
    />
  );
}

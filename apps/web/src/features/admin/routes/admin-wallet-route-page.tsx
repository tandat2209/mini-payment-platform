import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { useAdminWalletsQuery } from '@/features/admin/api/use-admin-queries';
import { AdminWalletPage } from '@/features/admin/components/admin-wallet-page';

export function AdminWalletRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/customers' });
  const walletsQuery = useAdminWalletsQuery();
  const query = search.query?.trim().toLowerCase() ?? '';
  const filteredWallets = useMemo(() => {
    const items = walletsQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((wallet) =>
      [
        wallet.customer.externalRef,
        wallet.wallet.id,
        wallet.wallet.label ?? '',
        ...wallet.balances.map((balance) => balance.currency),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [query, walletsQuery.data?.items]);

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
      wallets={filteredWallets}
    />
  );
}

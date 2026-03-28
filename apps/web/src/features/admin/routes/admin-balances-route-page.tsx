import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import { useAdminBalanceSummariesQuery } from '@/features/admin/api/use-admin-queries';
import { AdminBalancesPage } from '@/features/admin/components/admin-balances-page';

export function AdminBalancesRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const balancesQuery = useAdminBalanceSummariesQuery();

  return (
    <AdminBalancesPage
      balances={balancesQuery.data?.items ?? []}
      error={balancesQuery.error?.message ?? null}
      isLoading={balancesQuery.isLoading}
      onOpenLedger={(currency) => {
        void navigate({
          search: {
            currency,
            ledgerTransactionId: undefined,
          },
          to: '/admin/ledger',
        });
      }}
    />
  );
}

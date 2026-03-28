import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import {
  useAdminBalanceSummariesQuery,
  useAdminLedgerSummaryQuery,
} from '@/features/admin/api/use-admin-queries';
import { AdminBalancesPage } from '@/features/admin/components/admin-balances-page';

export function AdminBalancesRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const balancesQuery = useAdminBalanceSummariesQuery();
  const ledgerSummaryQuery = useAdminLedgerSummaryQuery();

  return (
    <AdminBalancesPage
      balances={balancesQuery.data?.items ?? []}
      error={balancesQuery.error?.message ?? ledgerSummaryQuery.error?.message ?? null}
      isLoading={balancesQuery.isLoading || ledgerSummaryQuery.isLoading}
      ledgerSummary={ledgerSummaryQuery.data ?? null}
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

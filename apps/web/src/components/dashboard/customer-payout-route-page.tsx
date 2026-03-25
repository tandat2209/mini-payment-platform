import type { JSX } from 'react';

import { useBalancesQuery, useRecipientsQuery } from '@/hooks/use-dashboard-queries';

import { CustomerPayoutPage } from './customer-payout-page';

export function CustomerPayoutRoutePage(): JSX.Element {
  const balancesQuery = useBalancesQuery();
  const recipientsQuery = useRecipientsQuery();

  return (
    <CustomerPayoutPage
      isRecipientsLoading={recipientsQuery.isLoading}
      recipients={recipientsQuery.data?.items ?? []}
      visibleBalances={balancesQuery.data?.balances ?? []}
    />
  );
}

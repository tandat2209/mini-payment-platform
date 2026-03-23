import type { JSX } from 'react';

import { useBalancesQuery } from '../../hooks/use-dashboard-queries';
import { CustomerPayoutPage } from './customer-payout-page';

export function CustomerPayoutRoutePage(): JSX.Element {
  const balancesQuery = useBalancesQuery();

  return <CustomerPayoutPage visibleBalances={balancesQuery.data?.balances ?? []} />;
}

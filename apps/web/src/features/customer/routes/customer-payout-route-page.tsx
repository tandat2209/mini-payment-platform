import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import { useBalancesQuery, useRecipientsQuery } from '@/features/customer/api/use-customer-queries';
import { CustomerPayoutPage } from '@/features/customer/components/customer-payout-page';

export function CustomerPayoutRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const balancesQuery = useBalancesQuery();
  const recipientsQuery = useRecipientsQuery();

  return (
    <CustomerPayoutPage
      isRecipientsLoading={recipientsQuery.isLoading}
      onBack={() => {
        void navigate({ to: '/' });
      }}
      onManageRecipients={() => {
        void navigate({ to: '/recipients' });
      }}
      recipients={recipientsQuery.data?.items ?? []}
      visibleBalances={balancesQuery.data?.balances ?? []}
    />
  );
}

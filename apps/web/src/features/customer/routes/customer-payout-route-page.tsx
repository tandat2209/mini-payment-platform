import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import {
  useBalancesQuery,
  useCreatePayoutMutation,
  useRecipientsQuery,
} from '@/features/customer/api/use-customer-queries';
import { CustomerPayoutPage } from '@/features/customer/components/customer-payout-page';

export function CustomerPayoutRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const balancesQuery = useBalancesQuery();
  const recipientsQuery = useRecipientsQuery();
  const createPayoutMutation = useCreatePayoutMutation();

  return (
    <CustomerPayoutPage
      isRecipientsLoading={recipientsQuery.isLoading}
      onBack={() => {
        void navigate({ to: '/' });
      }}
      onManageRecipients={() => {
        void navigate({ to: '/recipients' });
      }}
      onSubmitPayout={async (input) => await createPayoutMutation.mutateAsync(input)}
      onViewOverview={() => {
        void navigate({ to: '/' });
      }}
      recipients={recipientsQuery.data?.items ?? []}
      walletId={balancesQuery.data?.wallet.id ?? null}
      visibleBalances={balancesQuery.data?.balances ?? []}
    />
  );
}

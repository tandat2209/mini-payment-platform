import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import { useFundingDetailsQuery } from '@/features/customer/api/use-customer-queries';
import { AddMoneyPage } from '@/features/customer/components/add-money-page';

export function AddMoneyRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const fundingDetailsQuery = useFundingDetailsQuery(true);

  return (
    <AddMoneyPage
      fundingDetailsQuery={fundingDetailsQuery}
      onBack={() => {
        void navigate({ to: '/' });
      }}
    />
  );
}

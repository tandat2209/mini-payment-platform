import {
  useMutation,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  createPayout,
  type CreatePayoutRequest,
  type CreatePayoutResponse,
  fetchBalances,
  fetchFundingDetails,
  fetchRecipientCapabilities,
  fetchRecipientRequirements,
  fetchRecipients,
  fetchStatementOverview,
  fetchTransactionDetail,
  fetchTransactions,
  type RecipientCapabilitiesResponse,
  type RecipientListResponse,
  type RecipientRequirementsResponse,
  type StatementOverviewData,
  type TransactionDetailItem,
  type TransactionListResponse,
  type WalletBalancesResponse,
  type WalletFundingDetailsResponse,
} from '@/features/customer/api';

export function useBalancesQuery(): UseQueryResult<WalletBalancesResponse, Error> {
  return useQuery({
    queryFn: fetchBalances,
    queryKey: ['balances'],
  });
}

export function useFundingDetailsQuery(
  enabled: boolean,
): UseQueryResult<WalletFundingDetailsResponse, Error> {
  return useQuery({
    enabled,
    queryFn: fetchFundingDetails,
    queryKey: ['funding-details'],
  });
}

export function useTransactionsQuery(
  limit: number,
): UseQueryResult<TransactionListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchTransactions(limit),
    queryKey: ['transactions', limit],
  });
}

export function useTransactionDetailQuery(
  transactionId: string | null,
): UseQueryResult<TransactionDetailItem, Error> {
  return useQuery({
    enabled: transactionId !== null,
    queryFn: async () => await fetchTransactionDetail(transactionId ?? ''),
    queryKey: ['transaction-detail', transactionId],
  });
}

export function useRecipientsQuery(): UseQueryResult<RecipientListResponse, Error> {
  return useQuery({
    queryFn: fetchRecipients,
    queryKey: ['recipients'],
  });
}

export function useRecipientCapabilitiesQuery(input?: {
  countryCode?: string;
  rail?: 'ach' | 'sepa' | 'swift';
}): UseQueryResult<RecipientCapabilitiesResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchRecipientCapabilities(input),
    queryKey: ['recipient-capabilities', input?.countryCode ?? null, input?.rail ?? null],
  });
}

export function useRecipientRequirementsQuery(input: {
  countryCode: string;
  currency: string;
  enabled: boolean;
  rail: 'ach' | 'sepa' | 'swift';
}): UseQueryResult<RecipientRequirementsResponse, Error> {
  return useQuery({
    enabled: input.enabled,
    queryFn: async () =>
      await fetchRecipientRequirements({
        countryCode: input.countryCode,
        currency: input.currency,
        rail: input.rail,
      }),
    queryKey: ['recipient-requirements', input.rail, input.countryCode, input.currency],
  });
}

export function useStatementsQuery(): UseQueryResult<StatementOverviewData, Error> {
  return useQuery({
    queryFn: fetchStatementOverview,
    queryKey: ['statements'],
  });
}

export function useCreatePayoutMutation(): UseMutationResult<
  CreatePayoutResponse,
  Error,
  CreatePayoutRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayout,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['balances'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['statements'] }),
      ]);
    },
  });
}

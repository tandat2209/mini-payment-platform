import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  fetchBalances,
  fetchFundingDetails,
  fetchRecipients,
  fetchStatementOverview,
  fetchTransactionDetail,
  fetchTransactions,
  type RecipientListResponse,
  type StatementOverviewData,
  type TransactionDetailItem,
  type TransactionListResponse,
  type WalletBalancesResponse,
  type WalletFundingDetailsResponse,
} from '../api';

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

export function useStatementsQuery(): UseQueryResult<StatementOverviewData, Error> {
  return useQuery({
    queryFn: fetchStatementOverview,
    queryKey: ['statements'],
  });
}

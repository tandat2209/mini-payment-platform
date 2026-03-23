import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  fetchBalances,
  fetchRecipients,
  fetchStatementOverview,
  fetchTransactions,
  type RecipientListResponse,
  type StatementOverviewData,
  type TransactionListResponse,
  type WalletBalancesResponse,
} from '../api';

export function useBalancesQuery(): UseQueryResult<WalletBalancesResponse, Error> {
  return useQuery({
    queryFn: fetchBalances,
    queryKey: ['balances'],
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

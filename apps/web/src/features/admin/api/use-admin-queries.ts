import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  type AdminLedgerDetailItem,
  type AdminLedgerListResponse,
  type AdminTransactionDetailItem,
  type AdminTransactionListResponse,
  fetchAdminLedgerDetail,
  fetchAdminLedgers,
  fetchAdminTransactionDetail,
  fetchAdminTransactions,
} from '@/features/admin/api';

export function useAdminTransactionsQuery(input: {
  cursor?: string | null;
  limit: number;
  query?: string;
  type?: string | null;
}): UseQueryResult<AdminTransactionListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminTransactions(input),
    queryKey: ['admin-transactions', input],
  });
}

export function useAdminTransactionDetailQuery(
  transactionId: string | null,
): UseQueryResult<AdminTransactionDetailItem, Error> {
  return useQuery({
    enabled: transactionId !== null,
    queryFn: async () => await fetchAdminTransactionDetail(transactionId ?? ''),
    queryKey: ['admin-transaction-detail', transactionId],
  });
}

export function useAdminLedgersQuery(input: {
  cursor?: string | null;
  limit: number;
  query?: string;
  transactionType?: string | null;
}): UseQueryResult<AdminLedgerListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminLedgers(input),
    queryKey: ['admin-ledgers', input],
  });
}

export function useAdminLedgerDetailQuery(
  ledgerTransactionId: string | null,
): UseQueryResult<AdminLedgerDetailItem, Error> {
  return useQuery({
    enabled: ledgerTransactionId !== null,
    queryFn: async () => await fetchAdminLedgerDetail(ledgerTransactionId ?? ''),
    queryKey: ['admin-ledger-detail', ledgerTransactionId],
  });
}

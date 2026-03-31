import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import {
  type AdminBalanceSummaryResponse,
  type AdminLedgerDetailItem,
  type AdminLedgerListResponse,
  type AdminPayoutListResponse,
  type AdminRecipientListResponse,
  type AdminReconciliationExceptionListResponse,
  type AdminReconciliationLineListResponse,
  type AdminReconciliationReportListResponse,
  type AdminTransactionDetailItem,
  type AdminTransactionListResponse,
  type AdminWalletListResponse,
  type AdminWebhookEventListResponse,
  fetchAdminBalanceSummaries,
  fetchAdminLedgerDetail,
  fetchAdminLedgers,
  fetchAdminPayouts,
  fetchAdminRecipients,
  fetchAdminReconciliationExceptions,
  fetchAdminReconciliationLines,
  fetchAdminReconciliationReports,
  fetchAdminTransactionDetail,
  fetchAdminTransactions,
  fetchAdminWallets,
  fetchAdminWebhooks,
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

export function useAdminLedgerSummaryQuery(): UseQueryResult<
  AdminLedgerListResponse['summary'],
  Error
> {
  return useQuery({
    queryFn: async () =>
      (
        await fetchAdminLedgers({
          limit: 1,
        })
      ).summary,
    queryKey: ['admin-ledger-summary'],
  });
}

export function useAdminWalletsQuery(): UseQueryResult<AdminWalletListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminWallets(),
    queryKey: ['admin-wallets'],
  });
}

export function useAdminBalanceSummariesQuery(): UseQueryResult<
  AdminBalanceSummaryResponse,
  Error
> {
  return useQuery({
    queryFn: async () => await fetchAdminBalanceSummaries(),
    queryKey: ['admin-balance-summaries'],
  });
}

export function useAdminPayoutsQuery(): UseQueryResult<AdminPayoutListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminPayouts(),
    queryKey: ['admin-payouts'],
  });
}

export function useAdminRecipientsQuery(): UseQueryResult<AdminRecipientListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminRecipients(),
    queryKey: ['admin-recipients'],
  });
}

export function useAdminWebhooksQuery(): UseQueryResult<AdminWebhookEventListResponse, Error> {
  return useQuery({
    queryFn: async () => await fetchAdminWebhooks(),
    queryKey: ['admin-webhooks'],
  });
}

export function useAdminReconciliationExceptionsQuery(): UseQueryResult<
  AdminReconciliationExceptionListResponse,
  Error
> {
  return useQuery({
    queryFn: async () => await fetchAdminReconciliationExceptions(),
    queryKey: ['admin-reconciliation-exceptions'],
  });
}

export function useAdminReconciliationReportsQuery(): UseQueryResult<
  AdminReconciliationReportListResponse,
  Error
> {
  return useQuery({
    queryFn: async () => await fetchAdminReconciliationReports(),
    queryKey: ['admin-reconciliation-reports'],
  });
}

export function useAdminReconciliationLinesQuery(): UseQueryResult<
  AdminReconciliationLineListResponse,
  Error
> {
  return useQuery({
    queryFn: async () => await fetchAdminReconciliationLines(),
    queryKey: ['admin-reconciliation-lines'],
  });
}

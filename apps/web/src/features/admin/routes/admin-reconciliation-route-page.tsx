import { useNavigate } from '@tanstack/react-router';
import { useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import {
  useAdminReconciliationExceptionsQuery,
  useAdminReconciliationLinesQuery,
  useAdminReconciliationReportsQuery,
} from '@/features/admin/api/use-admin-queries';
import { AdminReconciliationPage } from '@/features/admin/components/admin-reconciliation-page';

export function AdminReconciliationRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/reconciliation' });
  const exceptionsQuery = useAdminReconciliationExceptionsQuery();
  const reportsQuery = useAdminReconciliationReportsQuery();
  const linesQuery = useAdminReconciliationLinesQuery();
  const query = search.query?.trim().toLowerCase() ?? '';
  const filteredReports = useMemo(() => {
    const items = reportsQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((item) =>
      [
        item.id,
        item.processingStatus,
        item.provider,
        item.providerReportId,
        item.reportDate ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [query, reportsQuery.data?.items]);
  const filteredLines = useMemo(() => {
    const items = linesQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((item) =>
      [
        item.batchId,
        item.customerExternalRef,
        item.externalEventId ?? '',
        item.externalPayoutId ?? '',
        item.externalRequestId ?? '',
        item.id,
        item.linkedLedgerTransactionId ?? '',
        item.linkedPayoutId ?? '',
        item.linkedTransactionId ?? '',
        item.linkedWebhookEventId ?? '',
        item.outcome ?? '',
        item.outcomeSummary ?? '',
        item.providerLineId,
        item.providerReportId,
        item.severity ?? '',
        item.status,
        item.type,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [linesQuery.data?.items, query]);
  const filteredExceptions = useMemo(() => {
    const items = exceptionsQuery.data?.items ?? [];

    if (query.length === 0) {
      return items;
    }

    return items.filter((item) =>
      [
        item.kind,
        item.reference ?? '',
        item.severity,
        item.sourceId,
        item.summary,
        item.linkedLedgerTransactionId ?? '',
        item.linkedPayoutId ?? '',
        item.linkedTransactionId ?? '',
        item.linkedWebhookEventId ?? '',
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [exceptionsQuery.data?.items, query]);
  const error =
    reportsQuery.error?.message ??
    linesQuery.error?.message ??
    exceptionsQuery.error?.message ??
    null;
  const isLoading = reportsQuery.isLoading || linesQuery.isLoading || exceptionsQuery.isLoading;

  return (
    <AdminReconciliationPage
      error={error}
      exceptions={filteredExceptions}
      isLoading={isLoading}
      lines={filteredLines}
      onOpenLedger={(ledgerTransactionId) => {
        void navigate({
          search: {
            currency: undefined,
            ledgerTransactionId,
          },
          to: '/admin/ledger',
        });
      }}
      onOpenPayouts={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/payouts',
        });
      }}
      onOpenTransactions={(query) => {
        void navigate({
          search: {
            query,
            transactionId: undefined,
            type: undefined,
          },
          to: '/admin/transactions',
        });
      }}
      onOpenWebhooks={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/webhooks',
        });
      }}
      reports={filteredReports}
    />
  );
}

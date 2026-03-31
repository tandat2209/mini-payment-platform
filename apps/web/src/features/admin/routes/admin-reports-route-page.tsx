import { useNavigate, useSearch } from '@tanstack/react-router';
import type { JSX } from 'react';
import { useMemo } from 'react';

import {
  useAdminReconciliationLinesQuery,
  useAdminReconciliationReportsQuery,
} from '@/features/admin/api/use-admin-queries';
import { AdminReportsPage } from '@/features/admin/components/admin-reports-page';

export function AdminReportsRoutePage(): JSX.Element {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/reports' });
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

  return (
    <AdminReportsPage
      error={reportsQuery.error?.message ?? linesQuery.error?.message ?? null}
      isLoading={reportsQuery.isLoading || linesQuery.isLoading}
      lines={linesQuery.data?.items ?? []}
      onOpenReconciliation={(query) => {
        void navigate({
          search: {
            query,
          },
          to: '/admin/reconciliation',
        });
      }}
      reports={filteredReports}
    />
  );
}

import { BarChart3, FileBarChart2, GitCompareArrows, TriangleAlert } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type {
  AdminReconciliationLineItem,
  AdminReconciliationReportItem,
} from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, formatMoney, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminReportsPage({
  error,
  isLoading,
  lines,
  onOpenReconciliation,
  reports,
}: {
  error: string | null;
  isLoading: boolean;
  lines: AdminReconciliationLineItem[];
  onOpenReconciliation: (query: string) => void;
  reports: AdminReconciliationReportItem[];
}): JSX.Element {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );
  const selectedReportLines = useMemo(
    () => (selectedReport ? lines.filter((line) => line.batchId === selectedReport.id) : []),
    [lines, selectedReport],
  );
  const totals = useMemo(() => {
    const matchedLines = reports.reduce((sum, report) => sum + report.matchedCount, 0);
    const totalLines = reports.reduce((sum, report) => sum + report.lineCount, 0);
    const totalExceptions = reports.reduce((sum, report) => sum + report.exceptionCount, 0);

    return {
      matchedLines,
      totalExceptions,
      totalLines,
    };
  }, [reports]);

  return (
    <AdminPageShell
      description="Scan provider report history, daily coverage, and batch-level quality before drilling into reconciliation details."
      eyebrow="Reports"
      metrics={[
        {
          icon: FileBarChart2,
          label: 'Report batches',
          value: isLoading ? 'Loading' : String(reports.length),
        },
        {
          icon: GitCompareArrows,
          label: 'Matched lines',
          value: isLoading ? 'Loading' : String(totals.matchedLines),
        },
        {
          icon: TriangleAlert,
          label: 'Open exceptions',
          value: isLoading ? 'Loading' : String(totals.totalExceptions),
        },
      ]}
      title="Reporting workspace"
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Daily provider reports</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Batch history for finance and operations, with a direct jump into reconciliation.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7f9ff]">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#f4efe7] text-left">
                    <tr>
                      {['Report', 'Date', 'Lines', 'Exceptions', 'Match rate'].map((header) => (
                        <th
                          className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                          key={header}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {isLoading ? (
                      <EmptyRow colSpan={5} label="Loading report history..." />
                    ) : reports.length === 0 ? (
                      <EmptyRow colSpan={5} label="No provider reports received yet." />
                    ) : (
                      reports.map((report) => {
                        const matchRate =
                          report.lineCount > 0
                            ? Math.round((report.matchedCount / report.lineCount) * 100)
                            : 0;

                        return (
                          <tr
                            className={cn(
                              'cursor-pointer transition hover:bg-slate-50',
                              selectedReportId === report.id && 'bg-[#f4f7ff]',
                            )}
                            key={report.id}
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            <td className="px-3 py-3 align-top">
                              <div className="min-w-0">
                                <p className="truncate font-medium text-slate-950">
                                  {report.providerReportId}
                                </p>
                                <p className="truncate text-xs text-slate-500">{report.provider}</p>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top text-sm text-slate-700">
                              {report.reportDate
                                ? formatDate(report.reportDate, {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Unknown'}
                            </td>
                            <td className="px-3 py-3 align-top text-sm text-slate-700">
                              {report.matchedCount} / {report.lineCount}
                            </td>
                            <td className="px-3 py-3 align-top">
                              <Badge tone={report.exceptionCount > 0 ? 'warning' : 'positive'}>
                                {report.exceptionCount}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 align-top text-sm text-slate-700">
                              {matchRate}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet
        onOpenChange={(open) => !open && setSelectedReportId(null)}
        open={selectedReport !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-[min(920px,100vw)]"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Report batch
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedReport?.providerReportId ?? 'Detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedReport ? (
                <>
                  <DetailGrid
                    items={[
                      ['Provider', selectedReport.provider],
                      [
                        'Report date',
                        selectedReport.reportDate
                          ? formatDate(selectedReport.reportDate, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Unknown',
                      ],
                      ['Processing', toTitleCase(selectedReport.processingStatus)],
                      ['Line count', String(selectedReport.lineCount)],
                      ['Matched', String(selectedReport.matchedCount)],
                      ['Exceptions', String(selectedReport.exceptionCount)],
                    ]}
                  />

                  <SummarySection lines={selectedReportLines} />

                  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Related pages
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        className="h-9 rounded-full px-3"
                        onClick={() => onOpenReconciliation(selectedReport.providerReportId)}
                        type="button"
                        variant="outline"
                      >
                        Open reconciliation
                      </Button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
}

function SummarySection({ lines }: { lines: AdminReconciliationLineItem[] }): JSX.Element {
  const lineTypeSummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const line of lines) {
      counts.set(line.type, (counts.get(line.type) ?? 0) + 1);
    }

    return Array.from(counts.entries());
  }, [lines]);

  const currencySummary = useMemo(() => {
    const totals = new Map<string, { gross: bigint; returned: bigint; count: number }>();

    for (const line of lines) {
      const current = totals.get(line.amounts.gross.currency) ?? {
        count: 0,
        gross: BigInt(0),
        returned: BigInt(0),
      };

      current.count += 1;
      current.gross += BigInt(line.amounts.gross.amountMinor);
      current.returned += BigInt(line.amounts.returned?.amountMinor ?? '0');
      totals.set(line.amounts.gross.currency, current);
    }

    return Array.from(totals.entries());
  }, [lines]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          <BarChart3 className="h-4 w-4" />
          Line mix
        </div>
        <div className="mt-4 space-y-3">
          {lineTypeSummary.length === 0 ? (
            <p className="text-sm text-slate-500">No report lines linked to this batch yet.</p>
          ) : (
            lineTypeSummary.map(([type, count]) => (
              <div
                className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"
                key={type}
              >
                <p className="font-medium text-slate-950">{toTitleCase(type)}</p>
                <p className="text-sm text-slate-600">{count}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          <FileBarChart2 className="h-4 w-4" />
          Currency totals
        </div>
        <div className="mt-4 space-y-3">
          {currencySummary.length === 0 ? (
            <p className="text-sm text-slate-500">No currency totals available yet.</p>
          ) : (
            currencySummary.map(([currency, summary]) => (
              <div
                className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"
                key={currency}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{currency}</p>
                  <p className="text-sm text-slate-600">{summary.count} lines</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Gross</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatMoney({
                        amountMinor: summary.gross.toString(),
                        currency,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Returned</p>
                    <p className="mt-1 font-medium text-slate-900">
                      {formatMoney({
                        amountMinor: summary.returned.toString(),
                        currency,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DetailGrid({ items }: { items: Array<[string, string]> }): JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
          key={label}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 break-words font-medium text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }): JSX.Element {
  return (
    <tr>
      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={colSpan}>
        {label}
      </td>
    </tr>
  );
}

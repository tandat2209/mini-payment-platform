import { AlertTriangle, FileStack, GitCompareArrows } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type {
  AdminReconciliationExceptionItem,
  AdminReconciliationLineItem,
  AdminReconciliationReportItem,
} from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, formatMoney, shortenIdentifier, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type Selection =
  | { id: string; kind: 'exception' }
  | { id: string; kind: 'line' }
  | { id: string; kind: 'report' };

export function AdminReconciliationPage({
  error,
  exceptions,
  isLoading,
  lines,
  onOpenLedger,
  onOpenPayouts,
  onOpenTransactions,
  onOpenWebhooks,
  reports,
}: {
  error: string | null;
  exceptions: AdminReconciliationExceptionItem[];
  isLoading: boolean;
  lines: AdminReconciliationLineItem[];
  onOpenLedger: (ledgerTransactionId: string) => void;
  onOpenPayouts: (query: string) => void;
  onOpenTransactions: (query: string) => void;
  onOpenWebhooks: (query: string) => void;
  reports: AdminReconciliationReportItem[];
}): JSX.Element {
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectedReport = useMemo(
    () =>
      selection?.kind === 'report'
        ? (reports.find((item) => item.id === selection.id) ?? null)
        : null,
    [reports, selection],
  );
  const selectedLine = useMemo(
    () =>
      selection?.kind === 'line' ? (lines.find((item) => item.id === selection.id) ?? null) : null,
    [lines, selection],
  );
  const selectedException = useMemo(
    () =>
      selection?.kind === 'exception'
        ? (exceptions.find((item) => item.sourceId === selection.id) ?? null)
        : null,
    [exceptions, selection],
  );

  return (
    <AdminPageShell
      description="Inspect report batches, line outcomes, and the open exception queue without leaving the reconciliation workspace."
      eyebrow="Reconciliation"
      metrics={[
        {
          icon: FileStack,
          label: 'Reports',
          value: isLoading ? 'Loading' : String(reports.length),
        },
        {
          icon: GitCompareArrows,
          label: 'Line outcomes',
          value: isLoading ? 'Loading' : String(lines.length),
        },
        {
          icon: AlertTriangle,
          label: 'Open exceptions',
          value: isLoading ? 'Loading' : String(exceptions.length),
        },
      ]}
      title="Reconciliation workspace"
    >
      <div className="space-y-5">
        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <TableCard
          columns={['Report', 'Status', 'Window', 'Lines', 'Exceptions']}
          title="Recent reports"
        >
          {isLoading ? (
            <EmptyRow colSpan={5} label="Loading reconciliation reports..." />
          ) : reports.length === 0 ? (
            <EmptyRow colSpan={5} label="No reconciliation reports received yet." />
          ) : (
            reports.map((report) => (
              <tr
                className={cn(
                  'cursor-pointer transition hover:bg-slate-50',
                  selection?.kind === 'report' && selection.id === report.id && 'bg-emerald-50/50',
                )}
                key={report.id}
                onClick={() => setSelection({ id: report.id, kind: 'report' })}
              >
                <td className="px-3 py-3 align-top">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{report.providerReportId}</p>
                    <p className="truncate text-xs text-slate-500">
                      {shortenIdentifier(report.id)}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge tone={report.processingStatus === 'processed' ? 'positive' : 'warning'}>
                    {toTitleCase(report.processingStatus)}
                  </Badge>
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {report.reportDate
                    ? formatDate(report.reportDate, { day: '2-digit', month: 'short' })
                    : 'Unknown'}
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {report.matchedCount} matched / {report.lineCount} total
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {report.exceptionCount}
                </td>
              </tr>
            ))
          )}
        </TableCard>

        <TableCard
          columns={['Provider line', 'Type', 'Outcome', 'Amount', 'Report']}
          title="Line outcomes"
        >
          {isLoading ? (
            <EmptyRow colSpan={5} label="Loading reconciliation line outcomes..." />
          ) : lines.length === 0 ? (
            <EmptyRow colSpan={5} label="No reconciliation lines available yet." />
          ) : (
            lines.map((line) => (
              <tr
                className={cn(
                  'cursor-pointer transition hover:bg-slate-50',
                  selection?.kind === 'line' && selection.id === line.id && 'bg-emerald-50/50',
                )}
                key={line.id}
                onClick={() => setSelection({ id: line.id, kind: 'line' })}
              >
                <td className="px-3 py-3 align-top">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{line.providerLineId}</p>
                    <p className="truncate text-xs text-slate-500">{line.customerExternalRef}</p>
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {toTitleCase(line.type)}
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge
                    tone={
                      line.outcome === 'matched'
                        ? 'positive'
                        : line.severity === 'high'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {toTitleCase(line.outcome ?? 'unclassified')}
                  </Badge>
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {formatMoney(line.amounts.gross)}
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {shortenIdentifier(line.providerReportId)}
                </td>
              </tr>
            ))
          )}
        </TableCard>

        <TableCard
          columns={['Summary', 'Kind', 'Severity', 'Reference', 'Occurred']}
          title="Open exceptions"
        >
          {isLoading ? (
            <EmptyRow colSpan={5} label="Loading reconciliation exceptions..." />
          ) : exceptions.length === 0 ? (
            <EmptyRow colSpan={5} label="No reconciliation exceptions are currently open." />
          ) : (
            exceptions.map((item) => (
              <tr
                className={cn(
                  'cursor-pointer transition hover:bg-slate-50',
                  selection?.kind === 'exception' &&
                    selection.id === item.sourceId &&
                    'bg-emerald-50/50',
                )}
                key={item.sourceId}
                onClick={() => setSelection({ id: item.sourceId, kind: 'exception' })}
              >
                <td className="px-3 py-3 align-top">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{item.summary}</p>
                    <p className="truncate text-xs text-slate-500">
                      {shortenIdentifier(item.sourceId)}
                    </p>
                  </div>
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {toTitleCase(item.kind.replaceAll('_', ' '))}
                </td>
                <td className="px-3 py-3 align-top">
                  <Badge tone={item.severity === 'high' ? 'warning' : 'default'}>
                    {toTitleCase(item.severity)}
                  </Badge>
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {item.reference ?? 'Not set'}
                </td>
                <td className="px-3 py-3 align-top text-sm text-slate-700">
                  {item.occurredAt
                    ? formatDate(item.occurredAt, {
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        month: 'short',
                      })
                    : 'No timestamp'}
                </td>
              </tr>
            ))
          )}
        </TableCard>
      </div>

      <Sheet onOpenChange={(open) => !open && setSelection(null)} open={selection !== null}>
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-[min(1120px,100vw)]"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {selectedReport ? 'Report' : selectedLine ? 'Line outcome' : 'Exception'}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedReport?.providerReportId ??
                  selectedLine?.providerLineId ??
                  selectedException?.summary ??
                  'Detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedReport ? (
                <>
                  <DetailGrid
                    items={[
                      ['Provider', selectedReport.provider],
                      ['Status', toTitleCase(selectedReport.processingStatus)],
                      [
                        'Report date',
                        selectedReport.reportDate
                          ? formatDate(selectedReport.reportDate)
                          : 'Unknown',
                      ],
                      [
                        'Window',
                        selectedReport.reportWindowStart && selectedReport.reportWindowEnd
                          ? `${formatDate(selectedReport.reportWindowStart, {
                              day: '2-digit',
                              month: 'short',
                            })} to ${formatDate(selectedReport.reportWindowEnd, {
                              day: '2-digit',
                              month: 'short',
                            })}`
                          : 'Not set',
                      ],
                      [
                        'Received',
                        selectedReport.receivedAt
                          ? formatDate(selectedReport.receivedAt, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                            })
                          : 'Unknown',
                      ],
                      ['Matched', String(selectedReport.matchedCount)],
                      ['Total lines', String(selectedReport.lineCount)],
                      ['Exceptions', String(selectedReport.exceptionCount)],
                    ]}
                  />
                </>
              ) : null}

              {selectedLine ? (
                <>
                  <DetailGrid
                    items={[
                      ['Outcome', toTitleCase(selectedLine.outcome ?? 'unclassified')],
                      ['Type', toTitleCase(selectedLine.type)],
                      ['Status', toTitleCase(selectedLine.status)],
                      ['Gross', formatMoney(selectedLine.amounts.gross)],
                      ['Fee', formatMoney(selectedLine.amounts.fee)],
                      ['Net', formatMoney(selectedLine.amounts.net)],
                      [
                        'Returned',
                        selectedLine.amounts.returned
                          ? formatMoney(selectedLine.amounts.returned)
                          : 'Not returned',
                      ],
                      ['Report', selectedLine.providerReportId],
                      [
                        'Observed',
                        selectedLine.eventTimestamp
                          ? formatDate(selectedLine.eventTimestamp, {
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                            })
                          : 'Unknown',
                      ],
                    ]}
                  />

                  {selectedLine.outcomeSummary ? (
                    <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                      {selectedLine.outcomeSummary}
                    </div>
                  ) : null}

                  <CompareFactsSection line={selectedLine} />

                  <PayloadCompareSection
                    internalMatchPayload={selectedLine.internalMatchPayload}
                    rawReportPayload={selectedLine.rawReportPayload}
                  />

                  <RelatedActions
                    linkedLedgerTransactionId={selectedLine.linkedLedgerTransactionId}
                    linkedPayoutId={selectedLine.linkedPayoutId}
                    linkedTransactionId={selectedLine.linkedTransactionId}
                    linkedWebhookEventId={selectedLine.linkedWebhookEventId}
                    onOpenLedger={onOpenLedger}
                    onOpenPayouts={onOpenPayouts}
                    onOpenTransactions={onOpenTransactions}
                    onOpenWebhooks={onOpenWebhooks}
                  />
                </>
              ) : null}

              {selectedException ? (
                <>
                  <DetailGrid
                    items={[
                      ['Kind', toTitleCase(selectedException.kind.replaceAll('_', ' '))],
                      ['Severity', toTitleCase(selectedException.severity)],
                      ['Reference', selectedException.reference ?? 'Not set'],
                      ['Source', shortenIdentifier(selectedException.sourceId)],
                    ]}
                  />

                  <RelatedActions
                    linkedLedgerTransactionId={selectedException.linkedLedgerTransactionId}
                    linkedPayoutId={selectedException.linkedPayoutId}
                    linkedTransactionId={selectedException.linkedTransactionId}
                    linkedWebhookEventId={selectedException.linkedWebhookEventId}
                    onOpenLedger={onOpenLedger}
                    onOpenPayouts={onOpenPayouts}
                    onOpenTransactions={onOpenTransactions}
                    onOpenWebhooks={onOpenWebhooks}
                  />
                </>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
}

function TableCard({
  children,
  columns,
  title,
}: {
  children: JSX.Element | JSX.Element[];
  columns: string[];
  title: string;
}): JSX.Element {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#f4efe7] text-left">
                <tr>
                  {columns.map((header) => (
                    <th
                      className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                      key={header}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">{children}</tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
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

function RelatedActions({
  linkedLedgerTransactionId,
  linkedPayoutId,
  linkedTransactionId,
  linkedWebhookEventId,
  onOpenLedger,
  onOpenPayouts,
  onOpenTransactions,
  onOpenWebhooks,
}: {
  linkedLedgerTransactionId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  onOpenLedger: (ledgerTransactionId: string) => void;
  onOpenPayouts: (query: string) => void;
  onOpenTransactions: (query: string) => void;
  onOpenWebhooks: (query: string) => void;
}): JSX.Element {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Related pages
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {linkedPayoutId ? (
          <Button
            className="h-9 rounded-full px-3"
            onClick={() => onOpenPayouts(linkedPayoutId)}
            type="button"
            variant="outline"
          >
            Open payout
          </Button>
        ) : null}
        {linkedTransactionId ? (
          <Button
            className="h-9 rounded-full px-3"
            onClick={() => onOpenTransactions(linkedTransactionId)}
            type="button"
            variant="outline"
          >
            Open transaction
          </Button>
        ) : null}
        {linkedWebhookEventId ? (
          <Button
            className="h-9 rounded-full px-3"
            onClick={() => onOpenWebhooks(linkedWebhookEventId)}
            type="button"
            variant="outline"
          >
            Open webhook
          </Button>
        ) : null}
        {linkedLedgerTransactionId ? (
          <Button
            className="h-9 rounded-full px-3"
            onClick={() => onOpenLedger(linkedLedgerTransactionId)}
            type="button"
            variant="outline"
          >
            Open ledger
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CompareFactsSection({ line }: { line: AdminReconciliationLineItem }): JSX.Element {
  const internalFacts = extractInternalFacts(line.internalMatchPayload);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Provider vs internal
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        <CompareFactCard
          internalValue={internalFacts.status}
          label="Status"
          providerValue={toTitleCase(line.status)}
        />
        <CompareFactCard
          internalValue={internalFacts.gross}
          label="Gross"
          providerValue={formatMoney(line.amounts.gross)}
        />
        <CompareFactCard
          internalValue={internalFacts.fee}
          label="Fee"
          providerValue={formatMoney(line.amounts.fee)}
        />
        <CompareFactCard
          internalValue={internalFacts.net}
          label="Net"
          providerValue={formatMoney(line.amounts.net)}
        />
        <CompareFactCard
          internalValue={internalFacts.returned}
          label="Returned"
          providerValue={
            line.amounts.returned ? formatMoney(line.amounts.returned) : 'Not returned'
          }
        />
      </div>
    </div>
  );
}

function CompareFactCard({
  internalValue,
  label,
  providerValue,
}: {
  internalValue: string;
  label: string;
  providerValue: string;
}): JSX.Element {
  const matches = providerValue === internalValue;

  return (
    <div
      className={cn(
        'rounded-[18px] border px-4 py-4',
        matches ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <p className="text-slate-500">Provider</p>
          <p className="font-medium text-slate-950">{providerValue}</p>
        </div>
        <div>
          <p className="text-slate-500">Internal</p>
          <p className="font-medium text-slate-950">{internalValue}</p>
        </div>
      </div>
    </div>
  );
}

function PayloadCompareSection({
  internalMatchPayload,
  rawReportPayload,
}: {
  internalMatchPayload: Record<string, unknown> | null;
  rawReportPayload: Record<string, unknown>;
}): JSX.Element {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <PayloadCard payload={rawReportPayload} title="Raw provider line" />
      <PayloadCard payload={internalMatchPayload} title="Raw internal snapshot" />
    </div>
  );
}

function PayloadCard({
  payload,
  title,
}: {
  payload: Record<string, unknown> | null;
  title: string;
}): JSX.Element {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <div className="mt-4 overflow-x-auto rounded-[18px] border border-slate-200 bg-slate-50/70 p-4">
        <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
          {payload ? JSON.stringify(payload, null, 2) : 'No internal match was linked.'}
        </pre>
      </div>
    </div>
  );
}

function extractInternalFacts(payload: Record<string, unknown> | null): {
  fee: string;
  gross: string;
  net: string;
  returned: string;
  status: string;
} {
  const transaction = getObjectValue(payload, 'transaction');
  const payout = getObjectValue(payload, 'payout');

  return {
    fee: formatMinorFact(
      getStringValue(payout, 'feeAmountMinor') ?? getStringValue(transaction, 'feeAmountMinor'),
      getStringValue(payout, 'currency') ?? getStringValue(transaction, 'currency'),
    ),
    gross: formatMinorFact(
      getStringValue(payout, 'grossAmountMinor') ?? getStringValue(transaction, 'grossAmountMinor'),
      getStringValue(payout, 'currency') ?? getStringValue(transaction, 'currency'),
    ),
    net: formatMinorFact(
      getStringValue(payout, 'netAmountMinor') ?? getStringValue(transaction, 'netAmountMinor'),
      getStringValue(payout, 'currency') ?? getStringValue(transaction, 'currency'),
    ),
    returned: formatMinorFact(
      getStringValue(payout, 'returnedAmountMinor'),
      getStringValue(payout, 'currency') ?? getStringValue(transaction, 'currency'),
      'Not returned',
    ),
    status:
      toTitleCase(getStringValue(payout, 'status') ?? getStringValue(transaction, 'status')) ||
      'Not linked',
  };
}

function formatMinorFact(
  amountMinor: string | null,
  currency: string | null,
  fallback = 'Not linked',
): string {
  if (!amountMinor || !currency) {
    return fallback;
  }

  return formatMoney({
    amountMinor,
    currency,
  });
}

function getObjectValue(
  payload: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!payload) {
    return null;
  }

  const value = payload[key];

  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getStringValue(payload: Record<string, unknown> | null, key: string): string | null {
  if (!payload) {
    return null;
  }

  const value = payload[key];

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

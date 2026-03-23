import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { JSX } from 'react';
import { useDeferredValue, useMemo, useState } from 'react';

import { formatDate, formatMoney, getToneFromStatus, toTitleCase } from '../dashboard/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent } from '../ui/sheet';
import type { AdminLedgerTransactionRecord } from './admin-data';

export function AdminLedgerPanel({
  ledgerTransactions,
  onClose,
  onSelect,
  selectedLedgerTransaction,
  selectedLedgerTransactionId,
}: {
  ledgerTransactions: AdminLedgerTransactionRecord[];
  onClose: () => void;
  onSelect: (transactionId: string) => void;
  selectedLedgerTransaction: AdminLedgerTransactionRecord | null;
  selectedLedgerTransactionId: string | null;
}): JSX.Element {
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const deferredAccountSearchQuery = useDeferredValue(accountSearchQuery.trim().toLowerCase());
  const ledgerIntegrity = useMemo(
    () => getLedgerIntegritySummary(ledgerTransactions),
    [ledgerTransactions],
  );
  const columns = useMemo<Array<ColumnDef<AdminLedgerTransactionRecord>>>(
    () => [
      {
        accessorKey: 'reference',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-950">{row.original.reference}</p>
            <p className="truncate text-xs text-slate-500">{row.original.description}</p>
          </div>
        ),
        header: 'Reference',
      },
      {
        accessorKey: 'transactionType',
        cell: ({ row }) => (
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            {row.original.transactionType}
          </span>
        ),
        header: 'Type',
      },
      {
        accessorKey: 'currency',
        header: 'CCY',
      },
      {
        accessorKey: 'entries',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.entries.length}</span>
        ),
        header: 'Entries',
      },
      {
        id: 'integrity',
        cell: ({ row }) => {
          const integrity = getLedgerTransactionIntegrity(row.original);

          return (
            <Badge tone={integrity.isBalanced ? 'positive' : 'warning'}>
              {integrity.isBalanced ? 'Balanced' : 'Unbalanced'}
            </Badge>
          );
        },
        header: 'Integrity',
      },
      {
        accessorKey: 'userTransactionId',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.userTransactionId ?? 'Not linked'}
          </span>
        ),
        header: 'Linked txn',
      },
      {
        accessorKey: 'postedAt',
        cell: ({ row }) => (
          <div className="text-xs text-slate-500">
            {formatDate(row.original.postedAt, {
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
            })}
          </div>
        ),
        header: 'Posted',
      },
      {
        accessorKey: 'status',
        cell: ({ row }) => (
          <Badge tone={getToneFromStatus(row.original.status)}>
            {toTitleCase(row.original.status)}
          </Badge>
        ),
        header: 'Status',
      },
    ],
    [],
  );
  const filteredAccountRows = useMemo(
    () =>
      ledgerIntegrity.trialBalanceRows.filter((row) => {
        if (!deferredAccountSearchQuery) {
          return true;
        }

        return [row.accountCode, row.accountName, row.accountGroup, row.currency].some((value) =>
          value.toLowerCase().includes(deferredAccountSearchQuery),
        );
      }),
    [deferredAccountSearchQuery, ledgerIntegrity.trialBalanceRows],
  );
  const table = useReactTable({
    columns,
    data: ledgerTransactions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 8,
      },
    },
  });

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Ledger
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Posting explorer
            </h2>
          </div>
          <div className="text-sm text-slate-500">{ledgerTransactions.length} ledger bookings</div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <div className="grid gap-3 md:grid-cols-3">
            <IntegrityCard
              label="Integrity status"
              tone={ledgerIntegrity.unbalancedTransactions === 0 ? 'positive' : 'warning'}
              value={ledgerIntegrity.unbalancedTransactions === 0 ? 'Healthy' : 'Attention needed'}
            />
            <IntegrityCard
              label="Unbalanced transactions"
              tone={ledgerIntegrity.unbalancedTransactions === 0 ? 'positive' : 'warning'}
              value={String(ledgerIntegrity.unbalancedTransactions)}
            />
            <IntegrityCard
              label="Accounts in trial balance"
              tone="default"
              value={String(ledgerIntegrity.trialBalanceRows.length)}
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-[#fcfaf6] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Currency control
            </p>
            <div className="mt-3 space-y-3">
              {ledgerIntegrity.currencySummaries.map((summary) => (
                <div
                  className="rounded-[18px] border border-white bg-white px-4 py-3"
                  key={summary.currency}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{summary.currency}</p>
                    <Badge tone={summary.deltaMinor === 0n ? 'positive' : 'warning'}>
                      {summary.deltaMinor === 0n ? 'In balance' : 'Drift detected'}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <SummaryStat label="Debits" value={formatMoney(summary.debits)} />
                    <SummaryStat label="Credits" value={formatMoney(summary.credits)} />
                    <SummaryStat label="Delta" value={formatMoney(summary.delta)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
          <div className="border-b border-slate-200 bg-[#f4efe7] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Account classes
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#faf7f2] text-left">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Group
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Accounts
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Debits
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Credits
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {ledgerIntegrity.accountGroupSummaries.map((row) => (
                  <tr key={row.accountGroup}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-950">{row.accountGroup}</p>
                      <p className="mt-1 text-xs text-slate-500">{row.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row.accountCount}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatMoney(row.debits)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatMoney(row.credits)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                      {formatMoney(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
            <div className="border-b border-slate-200 bg-[#f4efe7] px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Account explorer
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Search specific accounts only when you need drill-down detail.
                  </p>
                </div>
                <label className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-slate-500 lg:w-[320px]">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    onChange={(event) => setAccountSearchQuery(event.target.value)}
                    placeholder="Search account code, name, group, or currency"
                    type="search"
                    value={accountSearchQuery}
                  />
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#faf7f2] text-left">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Account
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Group
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      CCY
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {filteredAccountRows.slice(0, 8).map((row) => (
                    <tr key={`${row.accountCode}-${row.currency}`}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-950">{row.accountName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                          {row.accountCode}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.accountGroup}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.currency}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-950">
                        {formatMoney(row.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-[#faf7f2] px-4 py-3 text-xs text-slate-500">
              Showing {Math.min(filteredAccountRows.length, 8)} of {filteredAccountRows.length}{' '}
              matching accounts. This explorer is intended to page or query server-side once the
              dataset grows beyond preview scale.
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-[#fcfaf6] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Exceptions
              </p>
              <div className="mt-3 space-y-3">
                {ledgerIntegrity.unbalancedTransactions > 0 ? (
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {ledgerIntegrity.unbalancedTransactions} unbalanced ledger transaction(s)
                    require review.
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    No unbalanced transactions detected.
                  </div>
                )}
                {ledgerIntegrity.currencySummaries.every((summary) => summary.deltaMinor === 0n) ? (
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Every tracked currency currently reconciles to zero delta.
                  </div>
                ) : (
                  <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    One or more currencies show a debit/credit mismatch.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#fcfaf6] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Scale posture
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This layout is summary-first by design. Thousands of wallet-liability accounts
                should not crowd the default ledger view; they belong in a searchable explorer or a
                dedicated account page.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#fcfaf6]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-[#f4efe7] text-left">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    className={
                      selectedLedgerTransactionId === row.original.id
                        ? 'cursor-pointer bg-sky-50/50 transition hover:bg-slate-50'
                        : 'cursor-pointer transition hover:bg-slate-50'
                    }
                    key={row.id}
                    onClick={() => onSelect(row.original.id)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td className="px-3 py-3 align-top text-sm" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-[#faf7f2] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </p>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 rounded-full px-3"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                className="h-8 rounded-full px-3"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                variant="outline"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Sheet
        onOpenChange={(open) => {
          if (!open) {
            onClose();
          }
        }}
        open={selectedLedgerTransaction !== null}
      >
        <SheetContent
          className="grid h-screen w-[min(560px,100vw)] overflow-y-auto border-y-0 border-r-0 border-l border-slate-200 bg-[#fffdf9] p-0"
          hideOverlay
          side="right"
        >
          {selectedLedgerTransaction ? (
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Ledger transaction
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {selectedLedgerTransaction.reference}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLedgerTransaction.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <IntegrityCard
                  label="Integrity"
                  tone={
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).isBalanced
                      ? 'positive'
                      : 'warning'
                  }
                  value={
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).isBalanced
                      ? 'Balanced'
                      : 'Unbalanced'
                  }
                />
                <IntegrityCard
                  label="Debits"
                  tone="default"
                  value={formatMoney(
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).debits,
                  )}
                />
                <IntegrityCard
                  label="Credits"
                  tone="default"
                  value={formatMoney(
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).credits,
                  )}
                />
                <IntegrityCard
                  label="Delta"
                  tone={
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).deltaMinor === 0n
                      ? 'positive'
                      : 'warning'
                  }
                  value={formatMoney(
                    getLedgerTransactionIntegrity(selectedLedgerTransaction).delta,
                  )}
                />
              </div>

              <dl className="space-y-3 rounded-[24px] border border-slate-200 bg-[#f9f6f1] p-4">
                <DetailRow
                  label="Type"
                  value={toTitleCase(selectedLedgerTransaction.transactionType)}
                />
                <DetailRow
                  label="Posted"
                  value={formatDate(selectedLedgerTransaction.postedAt, {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <DetailRow
                  label="Linked user transaction"
                  value={selectedLedgerTransaction.userTransactionId ?? 'Not linked'}
                />
              </dl>

              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Account
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Direction
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {selectedLedgerTransaction.entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-3">
                          <p className="text-sm font-semibold text-slate-950">
                            {entry.accountName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
                            {entry.accountCode}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={entry.direction === 'debit' ? 'default' : 'positive'}>
                            {toTitleCase(entry.direction)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-slate-950">
                          {formatMoney(entry.amount)}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-500">{entry.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function IntegrityCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'default' | 'positive' | 'warning';
  value: string;
}): JSX.Element {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#fcfaf6] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        {tone === 'default' ? null : (
          <Badge tone={tone}>{tone === 'positive' ? 'OK' : 'Review'}</Badge>
        )}
      </div>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function getLedgerTransactionIntegrity(transaction: AdminLedgerTransactionRecord): {
  credits: { amountMinor: string; currency: string };
  debits: { amountMinor: string; currency: string };
  delta: { amountMinor: string; currency: string };
  deltaMinor: bigint;
  isBalanced: boolean;
} {
  let debitMinor = 0n;
  let creditMinor = 0n;

  for (const entry of transaction.entries) {
    const amountMinor = BigInt(entry.amount.amountMinor);

    if (entry.direction === 'debit') {
      debitMinor += amountMinor;
      continue;
    }

    creditMinor += amountMinor;
  }

  const deltaMinor = debitMinor - creditMinor;

  return {
    credits: { amountMinor: creditMinor.toString(), currency: transaction.currency },
    debits: { amountMinor: debitMinor.toString(), currency: transaction.currency },
    delta: { amountMinor: deltaMinor.toString(), currency: transaction.currency },
    deltaMinor,
    isBalanced: deltaMinor === 0n,
  };
}

function getLedgerIntegritySummary(transactions: AdminLedgerTransactionRecord[]): {
  accountGroupSummaries: Array<{
    accountCount: number;
    accountGroup: string;
    credits: { amountMinor: string; currency: string };
    debits: { amountMinor: string; currency: string };
    description: string;
    net: { amountMinor: string; currency: string };
  }>;
  currencySummaries: Array<{
    credits: { amountMinor: string; currency: string };
    currency: string;
    debits: { amountMinor: string; currency: string };
    delta: { amountMinor: string; currency: string };
    deltaMinor: bigint;
  }>;
  trialBalanceRows: Array<{
    accountCode: string;
    accountGroup: string;
    accountName: string;
    credits: { amountMinor: string; currency: string };
    currency: string;
    debits: { amountMinor: string; currency: string };
    net: { amountMinor: string; currency: string };
  }>;
  unbalancedTransactions: number;
} {
  const accountMap = new Map<
    string,
    {
      accountCode: string;
      accountGroup: string;
      accountName: string;
      creditMinor: bigint;
      currency: string;
      debitMinor: bigint;
    }
  >();
  const currencyMap = new Map<
    string,
    {
      creditMinor: bigint;
      currency: string;
      debitMinor: bigint;
    }
  >();
  const groupMap = new Map<
    string,
    {
      accountCount: number;
      accountGroup: string;
      creditMinor: bigint;
      currency: string;
      debitMinor: bigint;
      description: string;
    }
  >();
  let unbalancedTransactions = 0;

  for (const transaction of transactions) {
    const integrity = getLedgerTransactionIntegrity(transaction);

    if (!integrity.isBalanced) {
      unbalancedTransactions += 1;
    }

    const currencySummary = currencyMap.get(transaction.currency) ?? {
      creditMinor: 0n,
      currency: transaction.currency,
      debitMinor: 0n,
    };

    currencySummary.creditMinor += BigInt(integrity.credits.amountMinor);
    currencySummary.debitMinor += BigInt(integrity.debits.amountMinor);
    currencyMap.set(transaction.currency, currencySummary);

    for (const entry of transaction.entries) {
      const key = `${entry.accountCode}:${entry.amount.currency}`;
      const accountGroup = getAccountGroup(entry.accountCode);
      const accountSummary = accountMap.get(key) ?? {
        accountCode: entry.accountCode,
        accountGroup,
        accountName: entry.accountName,
        creditMinor: 0n,
        currency: entry.amount.currency,
        debitMinor: 0n,
      };
      const amountMinor = BigInt(entry.amount.amountMinor);

      if (entry.direction === 'debit') {
        accountSummary.debitMinor += amountMinor;
      } else {
        accountSummary.creditMinor += amountMinor;
      }

      accountMap.set(key, accountSummary);
    }
  }

  for (const accountSummary of accountMap.values()) {
    const key = `${accountSummary.accountGroup}:${accountSummary.currency}`;
    const groupSummary = groupMap.get(key) ?? {
      accountCount: 0,
      accountGroup: accountSummary.accountGroup,
      creditMinor: 0n,
      currency: accountSummary.currency,
      debitMinor: 0n,
      description: getAccountGroupDescription(accountSummary.accountGroup),
    };

    groupSummary.accountCount += 1;
    groupSummary.creditMinor += accountSummary.creditMinor;
    groupSummary.debitMinor += accountSummary.debitMinor;
    groupMap.set(key, groupSummary);
  }

  return {
    accountGroupSummaries: [...groupMap.values()]
      .sort((left, right) => left.accountGroup.localeCompare(right.accountGroup))
      .map((summary) => ({
        accountCount: summary.accountCount,
        accountGroup: summary.accountGroup,
        credits: { amountMinor: summary.creditMinor.toString(), currency: summary.currency },
        debits: { amountMinor: summary.debitMinor.toString(), currency: summary.currency },
        description: summary.description,
        net: {
          amountMinor: (summary.debitMinor - summary.creditMinor).toString(),
          currency: summary.currency,
        },
      })),
    currencySummaries: [...currencyMap.values()].map((summary) => ({
      credits: { amountMinor: summary.creditMinor.toString(), currency: summary.currency },
      currency: summary.currency,
      debits: { amountMinor: summary.debitMinor.toString(), currency: summary.currency },
      delta: {
        amountMinor: (summary.debitMinor - summary.creditMinor).toString(),
        currency: summary.currency,
      },
      deltaMinor: summary.debitMinor - summary.creditMinor,
    })),
    trialBalanceRows: [...accountMap.values()]
      .sort((left, right) => left.accountCode.localeCompare(right.accountCode))
      .map((summary) => ({
        accountCode: summary.accountCode,
        accountGroup: summary.accountGroup,
        accountName: summary.accountName,
        credits: { amountMinor: summary.creditMinor.toString(), currency: summary.currency },
        currency: summary.currency,
        debits: { amountMinor: summary.debitMinor.toString(), currency: summary.currency },
        net: {
          amountMinor: (summary.debitMinor - summary.creditMinor).toString(),
          currency: summary.currency,
        },
      })),
    unbalancedTransactions,
  };
}

function getAccountGroup(accountCode: string): string {
  if (accountCode.startsWith('wallet_')) {
    return 'Wallet liabilities';
  }

  if (accountCode.startsWith('platform_cash_')) {
    return 'Platform cash';
  }

  if (accountCode.startsWith('platform_revenue_')) {
    return 'Platform revenue';
  }

  if (accountCode.startsWith('recipient_payable_')) {
    return 'Recipient payables';
  }

  return 'Other accounts';
}

function getAccountGroupDescription(accountGroup: string): string {
  switch (accountGroup) {
    case 'Wallet liabilities':
      return 'Customer wallet obligation accounts, usually the largest account family.';
    case 'Platform cash':
      return 'Settlement and safeguarding cash positions held by the platform.';
    case 'Platform revenue':
      return 'Fee and revenue recognition accounts.';
    case 'Recipient payables':
      return 'Amounts owed onward to payout beneficiaries.';
    default:
      return 'Accounts outside the main operational groupings.';
  }
}

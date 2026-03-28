import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminLedgerDetailItem, AdminLedgerItem } from '@/features/admin/api';
import {
  formatDate,
  formatMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from '@/lib/formatters';

export function AdminLedgerPanel({
  canNextPage,
  canPreviousPage,
  detailError,
  detailLoading,
  error,
  isLoading,
  ledgerTransactions,
  onClose,
  onOpenTransaction,
  onNextPage,
  onPreviousPage,
  onSearchChange,
  onSelect,
  pageIndex,
  searchQuery,
  selectedLedgerTransaction,
  selectedLedgerTransactionEntries,
  selectedLedgerTransactionId,
}: {
  canNextPage: boolean;
  canPreviousPage: boolean;
  detailError: string | null;
  detailLoading: boolean;
  error: string | null;
  isLoading: boolean;
  ledgerTransactions: AdminLedgerItem[];
  onClose: () => void;
  onOpenTransaction: (transactionId: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onSearchChange: (query: string) => void;
  onSelect: (transactionId: string) => void;
  pageIndex: number;
  searchQuery: string;
  selectedLedgerTransaction: AdminLedgerItem | AdminLedgerDetailItem | null;
  selectedLedgerTransactionEntries: AdminLedgerDetailItem['entries'] | null;
  selectedLedgerTransactionId: string | null;
}): JSX.Element {
  const columns = useMemo<Array<ColumnDef<AdminLedgerItem>>>(
    () => [
      {
        accessorKey: 'reference',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-950">
              {row.original.reference ?? 'No reference'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {row.original.description ?? 'No description'}
            </p>
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
        accessorKey: 'entryCount',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.entryCount}</span>
        ),
        header: 'Entries',
      },
      {
        id: 'integrity',
        cell: ({ row }) => (
          <Badge tone={row.original.integrity.isBalanced ? 'positive' : 'warning'}>
            {row.original.integrity.isBalanced ? 'Balanced' : 'Unbalanced'}
          </Badge>
        ),
        header: 'Integrity',
      },
      {
        accessorKey: 'userTransactionId',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.userTransactionId
              ? shortenIdentifier(row.original.userTransactionId)
              : 'Not linked'}
          </span>
        ),
        header: 'Linked txn',
      },
      {
        accessorKey: 'postedAt',
        cell: ({ row }) => (
          <div className="text-xs text-slate-500">
            {row.original.postedAt
              ? formatDate(row.original.postedAt, {
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'short',
                })
              : 'Not posted'}
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
  const table = useReactTable({
    columns,
    data: ledgerTransactions,
    getCoreRowModel: getCoreRowModel(),
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
          <div className="text-sm text-slate-500">
            {isLoading ? 'Loading ledger...' : `${ledgerTransactions.length} bookings on this page`}
          </div>
        </div>

        <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-slate-500">
          <Search className="h-4 w-4" />
          <input
            className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search reference, description, ledger id, user transaction, or webhook"
            type="search"
            value={searchQuery}
          />
        </label>

        {error ? (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

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
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={8}>
                      Loading ledger postings...
                    </td>
                  </tr>
                ) : ledgerTransactions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={8}>
                      No ledger transactions matched this admin view.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-[#faf7f2] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Page {pageIndex}</p>
            <div className="flex items-center gap-2">
              <Button
                className="h-8 rounded-full px-3"
                disabled={!canPreviousPage}
                onClick={onPreviousPage}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                className="h-8 rounded-full px-3"
                disabled={!canNextPage}
                onClick={onNextPage}
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
        open={selectedLedgerTransactionId !== null}
      >
        <SheetContent
          className="grid h-screen w-[min(560px,100vw)] overflow-y-auto border-y-0 border-r-0 border-l border-slate-200 bg-[#fffdf9] p-0"
          hideOverlay
          side="right"
        >
          {selectedLedgerTransactionId && detailLoading && !selectedLedgerTransaction ? (
            <div className="p-5 text-sm text-slate-500">Loading ledger transaction detail...</div>
          ) : null}
          {selectedLedgerTransactionId && detailError ? (
            <div className="m-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {detailError}
            </div>
          ) : null}
          {selectedLedgerTransaction ? (
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Ledger transaction
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {selectedLedgerTransaction.reference ?? 'No reference'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLedgerTransaction.description ?? 'No description'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={selectedLedgerTransaction.integrity.isBalanced ? 'positive' : 'warning'}
                >
                  {selectedLedgerTransaction.integrity.isBalanced ? 'Balanced' : 'Unbalanced'}
                </Badge>
                <Badge tone="default">Debits {formatMoney(selectedLedgerTransaction.debits)}</Badge>
                <Badge tone="default">
                  Credits {formatMoney(selectedLedgerTransaction.credits)}
                </Badge>
                <Badge
                  tone={
                    selectedLedgerTransaction.integrity.delta.amountMinor === '0'
                      ? 'positive'
                      : 'warning'
                  }
                >
                  Delta {formatMoney(selectedLedgerTransaction.integrity.delta)}
                </Badge>
              </div>

              <dl className="space-y-3 rounded-[24px] border border-slate-200 bg-[#f9f6f1] p-4">
                <DetailRow
                  label="Type"
                  value={toTitleCase(selectedLedgerTransaction.transactionType)}
                />
                <DetailRow
                  label="Posted"
                  value={
                    selectedLedgerTransaction.postedAt
                      ? formatDate(selectedLedgerTransaction.postedAt, {
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Not posted'
                  }
                />
                <DetailRow
                  label="Linked user transaction"
                  value={
                    selectedLedgerTransaction.userTransactionId
                      ? shortenIdentifier(selectedLedgerTransaction.userTransactionId)
                      : 'Not linked'
                  }
                />
                <DetailRow
                  label="Webhook"
                  value={
                    selectedLedgerTransaction.webhookEventId
                      ? shortenIdentifier(selectedLedgerTransaction.webhookEventId)
                      : 'Not linked'
                  }
                />
              </dl>

              {selectedLedgerTransaction.userTransactionId ? (
                <div className="rounded-[20px] border border-slate-200 bg-[#fcfaf6] px-4 py-4">
                  <Button
                    className="h-10 rounded-full px-4"
                    onClick={() => onOpenTransaction(selectedLedgerTransaction.userTransactionId!)}
                    variant="outline"
                  >
                    Open transaction
                  </Button>
                </div>
              ) : null}

              {detailLoading && !selectedLedgerTransactionEntries ? (
                <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                  Loading ledger entries...
                </div>
              ) : null}

              {selectedLedgerTransactionEntries ? (
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
                      {selectedLedgerTransactionEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-3 py-3">
                            <p className="text-sm font-semibold text-slate-950">
                              {entry.account.name}
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
                          <td className="px-3 py-3 text-sm text-slate-500">
                            {entry.description ?? 'No description'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
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

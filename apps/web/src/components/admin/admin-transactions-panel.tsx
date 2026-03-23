import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo } from 'react';

import { cn } from '../../lib/utils';
import {
  formatDate,
  formatMoney,
  formatSignedTransactionMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from '../dashboard/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Sheet, SheetContent } from '../ui/sheet';
import type { AdminTransactionRecord } from './admin-data';

export function AdminTransactionsPanel({
  onClose,
  onSearchChange,
  onSelect,
  onTypeFilterChange,
  searchQuery,
  selectedTransactionId,
  selectedTransaction,
  transactions,
  typeFilter,
}: {
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onSelect: (transactionId: string) => void;
  onTypeFilterChange: (filter: 'all' | 'funding' | 'payout') => void;
  searchQuery: string;
  selectedTransaction: AdminTransactionRecord | null;
  selectedTransactionId: string | null;
  transactions: AdminTransactionRecord[];
  typeFilter: 'all' | 'funding' | 'payout';
}): JSX.Element {
  const columns = useMemo<Array<ColumnDef<AdminTransactionRecord>>>(
    () => [
      {
        accessorKey: 'customerExternalRef',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-950">{row.original.customerName}</p>
            <p className="truncate text-xs text-slate-500">{row.original.customerExternalRef}</p>
          </div>
        ),
        header: 'Customer',
      },
      {
        accessorKey: 'type',
        cell: ({ row }) => (
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
            {row.original.type}
          </div>
        ),
        header: 'Type',
      },
      {
        accessorKey: 'description',
        cell: ({ row }) => (
          <div className="max-w-[320px] truncate text-sm text-slate-700">
            {row.original.description}
          </div>
        ),
        header: 'Narrative',
      },
      {
        accessorKey: 'amounts.net.amountMinor',
        cell: ({ row }) => (
          <p
            className={
              row.original.direction === 'credit'
                ? 'text-sm font-semibold text-emerald-700'
                : 'text-sm font-semibold text-slate-950'
            }
          >
            {formatSignedTransactionMoney(row.original)}
          </p>
        ),
        header: 'Net',
      },
      {
        accessorKey: 'reference',
        cell: ({ row }) => <div className="text-xs text-slate-500">{row.original.reference}</div>,
        header: 'Reference',
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
  const table = useReactTable({
    columns,
    data: transactions,
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
              Transactions
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Platform transaction watch
            </h2>
          </div>
          <div className="text-sm text-slate-500">{transactions.length} records visible</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search customer, reference, or description"
              type="search"
              value={searchQuery}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(['all', 'funding', 'payout'] as const).map((filter) => (
              <button
                className={cn(
                  'rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                  typeFilter === filter
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-700',
                )}
                key={filter}
                onClick={() => onTypeFilterChange(filter)}
                type="button"
              >
                {filter === 'all' ? 'All types' : toTitleCase(filter)}
              </button>
            ))}
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
                    className={cn(
                      'cursor-pointer transition hover:bg-slate-50',
                      selectedTransactionId === row.original.id && 'bg-emerald-50/50',
                    )}
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
        open={selectedTransaction !== null}
      >
        <SheetContent
          className="grid h-screen overflow-y-auto border-y-0 border-r-0 border-l border-slate-200 bg-[#fffdf9] p-0"
          hideOverlay
          side="right"
        >
          {selectedTransaction ? (
            <div className="space-y-5 p-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Selected transaction
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">
                  {selectedTransaction.customerName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedTransaction.customerExternalRef}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Gross" value={formatMoney(selectedTransaction.amounts.gross)} />
                <Metric label="Net" value={formatMoney(selectedTransaction.amounts.net)} />
                <Metric label="Status" value={toTitleCase(selectedTransaction.status)} />
              </div>

              <dl className="space-y-3 rounded-[24px] border border-slate-200 bg-[#f9f6f1] p-4">
                <DetailRow label="Reference" value={selectedTransaction.reference} />
                <DetailRow
                  label="Transaction ID"
                  value={shortenIdentifier(selectedTransaction.id)}
                />
                <DetailRow label="Type" value={toTitleCase(selectedTransaction.type)} />
                <DetailRow label="Direction" value={toTitleCase(selectedTransaction.direction)} />
                <DetailRow label="Customer" value={selectedTransaction.customerName} />
                <DetailRow
                  label="Occurred"
                  value={formatDate(selectedTransaction.occurredAt, {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <DetailRow
                  label="Posted"
                  value={formatDate(selectedTransaction.postedAt, {
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                />
                <DetailRow label="Source" value={toTitleCase(selectedTransaction.source)} />
              </dl>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
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

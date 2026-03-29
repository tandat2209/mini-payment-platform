import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TransactionDetailItem, TransactionItem } from '@/features/customer/api';
import {
  formatDate,
  formatMoney,
  formatSignedTransactionMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from '@/features/customer/lib/utils';

import { LoadingBlock, SectionHeader } from './shared';

export function TransactionDetailPanel({
  onClose,
  query,
  selectedTransaction,
  selectedTransactionId,
}: {
  onClose: () => void;
  query: UseQueryResult<TransactionDetailItem, Error>;
  selectedTransaction: TransactionItem | null;
  selectedTransactionId: string | null;
}): JSX.Element {
  const transaction = query.data ?? selectedTransaction;
  const payout = query.data?.payout ?? null;

  return (
    <Dialog
      onOpenChange={(open: boolean) => !open && onClose()}
      open={selectedTransactionId !== null}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader className="pr-12">
          <SectionHeader
            {...(transaction ? { action: toTitleCase(transaction.type) } : {})}
            title="Transaction"
          />
          <DialogTitle className="sr-only">Transaction detail</DialogTitle>
        </DialogHeader>

        {selectedTransactionId && query.isLoading && !selectedTransaction ? (
          <div className="space-y-3">
            <LoadingBlock className="h-28 rounded-[24px]" />
            <LoadingBlock className="h-16 rounded-[20px]" />
            <LoadingBlock className="h-36 rounded-[24px]" />
          </div>
        ) : null}

        {selectedTransactionId && query.isLoading && selectedTransaction ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Loading full transaction detail...
          </div>
        ) : null}

        {selectedTransactionId && query.isError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {query.error instanceof Error ? query.error.message : 'Transaction detail unavailable'}
          </div>
        ) : null}

        {transaction ? (
          <>
            <div className="rounded-[24px] border border-[#e7e1d8] bg-[#fcfaf6] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2.5">
                  <div
                    className={
                      transaction.direction === 'credit'
                        ? 'flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700'
                        : 'flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600'
                    }
                  >
                    {transaction.direction === 'credit' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Wallet impact
                    </p>
                    <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                      {formatSignedTransactionMoney(transaction)}
                    </p>
                    <p className="mt-1.5 max-w-xl text-sm leading-5 text-slate-500">
                      {transaction.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone={getToneFromStatus(transaction.status)}>
                    {toTitleCase(transaction.status)}
                  </Badge>
                  <Badge>{transaction.currency}</Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DetailMetric label="Wallet amount" value={formatMoney(transaction.amounts.gross)} />
              <DetailMetric label="Fee" value={formatMoney(transaction.amounts.fee)} />
              <DetailMetric label="Recipient amount" value={formatMoney(transaction.amounts.net)} />
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-950">Overview</p>
                </div>
                <dl className="mt-4 space-y-3">
                  <DetailRow
                    label="Reference"
                    value={transaction.reference ?? shortenIdentifier(transaction.id)}
                  />
                  <DetailRow label="Transaction ID" value={shortenIdentifier(transaction.id)} />
                  <DetailRow label="Direction" value={toTitleCase(transaction.direction)} />
                  <DetailRow label="Type" value={toTitleCase(transaction.type)} />
                  <DetailRow
                    label="Occurred"
                    value={formatDate(transaction.occurredAt, {
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  />
                  <DetailRow
                    label="Posted"
                    value={formatDate(transaction.postedAt, {
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  />
                </dl>
              </div>

              <div className="rounded-[20px] border border-slate-200 bg-white p-4">
                {payout ? (
                  <>
                    <p className="text-sm font-semibold text-slate-950">Payout context</p>
                    <dl className="mt-4 space-y-3">
                      <DetailRow
                        label="Payout reference"
                        value={payout.payoutReference ?? payout.payoutId}
                      />
                      <DetailRow
                        label="Recipient"
                        value={payout.recipientName ?? payout.recipientId ?? 'Unknown recipient'}
                      />
                      <DetailRow
                        label="Recipient ID"
                        value={payout.recipientId ?? 'Not available'}
                      />
                    </dl>
                  </>
                ) : (
                  <div className="rounded-[18px] bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    No payout-specific context for this transaction.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 text-base font-semibold text-slate-950 sm:text-lg">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

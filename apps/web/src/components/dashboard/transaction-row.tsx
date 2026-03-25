import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { JSX } from 'react';

import type { TransactionItem } from '@/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import {
  formatDate,
  formatSignedTransactionMoney,
  getToneFromStatus,
  shortenIdentifier,
  toTitleCase,
} from './utils';

export function TransactionRow({
  isSelected,
  onSelect,
  transaction,
}: {
  isSelected: boolean;
  onSelect: (transactionId: string) => void;
  transaction: TransactionItem;
}): JSX.Element {
  return (
    <button
      className={cn(
        'grid w-full gap-3 rounded-[22px] border bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:shadow-[0_10px_30px_rgba(15,23,42,0.04)] md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px] md:items-center',
        isSelected
          ? 'border-emerald-300 bg-emerald-50/40 shadow-[0_12px_30px_rgba(16,185,129,0.08)]'
          : 'border-slate-200',
      )}
      onClick={() => onSelect(transaction.id)}
      type="button"
    >
      <div className="min-w-0 md:pr-3">
        <div className="flex items-center gap-3">
          <div
            className={
              transaction.direction === 'credit'
                ? 'flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50'
                : 'flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50'
            }
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {transaction.description}
            </p>
            <p className="mt-1 truncate text-sm text-slate-500">
              {toTitleCase(transaction.type)} ·{' '}
              {transaction.reference ?? shortenIdentifier(transaction.id)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        <span>{transaction.currency}</span>
      </div>

      <div className="text-left md:text-right">
        <p
          className={
            transaction.direction === 'credit'
              ? 'text-sm font-semibold text-emerald-700'
              : 'text-sm font-semibold text-slate-950'
          }
        >
          {formatSignedTransactionMoney(transaction)}
        </p>
        <p className="mt-1 text-xs text-slate-500 md:hidden">
          {toTitleCase(transaction.direction)}
        </p>
      </div>

      <div className="text-sm text-slate-500 md:text-right">
        <p>
          {formatDate(transaction.postedAt ?? transaction.occurredAt, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className="flex md:justify-end">
        <Badge tone={getToneFromStatus(transaction.status)}>
          {toTitleCase(transaction.status)}
        </Badge>
      </div>
    </button>
  );
}

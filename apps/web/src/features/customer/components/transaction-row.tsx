import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import type { TransactionItem } from '@/features/customer/api';
import {
  formatDate,
  formatSignedTransactionMoney,
  getToneFromStatus,
  toTitleCase,
} from '@/features/customer/lib/utils';
import { cn } from '@/lib/utils';

export function TransactionRow({
  isSelected,
  onSelect,
  transaction,
}: {
  isSelected: boolean;
  onSelect: (transactionId: string) => void;
  transaction: TransactionItem;
}): JSX.Element {
  const postedDate = formatDate(transaction.postedAt ?? transaction.occurredAt, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const mobilePostedDate = formatDate(transaction.postedAt ?? transaction.occurredAt, {
    day: 'numeric',
    month: 'short',
  });
  const displayTitle = getTransactionListTitle(transaction.description);
  const displaySubtitle = getTransactionListSubtitle(transaction);

  return (
    <button
      className={cn(
        'w-full rounded-[22px] border bg-white px-3.5 py-3 text-left transition hover:border-[#bfc9ff] hover:bg-[#f8faff] hover:shadow-[0_16px_34px_rgba(37,87,255,0.08)] md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px] md:items-center md:gap-3 md:px-4',
        isSelected
          ? 'border-[#8fa0ff] bg-[#f4f7ff] shadow-[0_16px_38px_rgba(37,87,255,0.12)]'
          : 'border-[#dfe5ff]',
      )}
      onClick={() => onSelect(transaction.id)}
      type="button"
    >
      <div className="space-y-3 md:contents">
        <div className="flex items-start gap-3 md:min-w-0 md:pr-3">
          <div
            className={
              transaction.direction === 'credit'
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100'
                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100'
            }
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft className="h-4 w-4 text-emerald-700" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-rose-600" />
            )}
          </div>

          <div className="min-w-0 flex-1 md:max-w-none">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:block">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#171b26]">{displayTitle}</p>
                <p className="mt-1 truncate text-xs font-medium text-[#9aa6ca] md:text-sm">
                  {displaySubtitle}
                </p>
              </div>

              <p
                className={
                  transaction.direction === 'credit'
                    ? 'shrink-0 text-sm font-semibold text-emerald-700 md:hidden'
                    : 'shrink-0 text-sm font-semibold text-rose-700 md:hidden'
                }
              >
                {formatSignedTransactionMoney(transaction)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs font-bold text-[#173184]">
              <span className="h-2 w-2 rounded-full bg-[#2557ff]" />
              {transaction.currency}
            </span>
            <Badge tone={getToneFromStatus(transaction.status)}>
              {toTitleCase(transaction.status)}
            </Badge>
          </div>
          <span className="shrink-0 text-xs font-semibold text-[#9aa6ca]">{mobilePostedDate}</span>
        </div>

        <div className="hidden items-center gap-2 text-sm font-bold text-[#657196] md:flex">
          <span className="h-2 w-2 rounded-full bg-[#2557ff]" />
          <span>{transaction.currency}</span>
        </div>

        <div className="hidden text-left md:block md:text-right">
          <p
            className={
              transaction.direction === 'credit'
                ? 'text-sm font-semibold text-emerald-700'
                : 'text-sm font-semibold text-rose-700'
            }
          >
            {formatSignedTransactionMoney(transaction)}
          </p>
        </div>

        <div className="hidden text-sm font-semibold text-[#9aa6ca] md:block md:text-right">
          <p>{postedDate}</p>
        </div>

        <div className="hidden md:flex md:justify-end">
          <Badge tone={getToneFromStatus(transaction.status)}>
            {toTitleCase(transaction.status)}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function getTransactionListTitle(description: string): string {
  const [primaryPart] = description.split(':');
  const normalizedPrimaryPart = primaryPart?.trim();

  if (normalizedPrimaryPart && normalizedPrimaryPart.length > 0) {
    return normalizedPrimaryPart;
  }

  return description;
}

function getTransactionListSubtitle(transaction: TransactionItem): string {
  const [, secondaryPart] = transaction.description.split(':');
  const normalizedSecondaryPart = secondaryPart?.trim();

  if (normalizedSecondaryPart && normalizedSecondaryPart.length > 0) {
    return normalizedSecondaryPart;
  }

  return toTitleCase(transaction.type);
}

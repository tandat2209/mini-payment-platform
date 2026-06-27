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
        'w-full rounded-[22px] border bg-surface px-3.5 py-3 text-left transition hover:border-primary-border-strong hover:bg-primary-surface-strong hover:shadow-primary-hover md:grid md:grid-cols-[minmax(0,1.6fr)_120px_160px_120px_120px] md:items-center md:gap-3 md:px-4',
        isSelected
          ? 'border-primary-border-selected bg-surface-selected shadow-primary-card'
          : 'border-primary-border',
      )}
      onClick={() => onSelect(transaction.id)}
      type="button"
    >
      <div className="space-y-3 md:contents">
        <div className="flex items-start gap-3 md:min-w-0 md:pr-3">
          <div
            className={
              transaction.direction === 'credit'
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success-muted'
                : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger-muted'
            }
          >
            {transaction.direction === 'credit' ? (
              <ArrowDownLeft className="h-4 w-4 text-success" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-danger" />
            )}
          </div>

          <div className="min-w-0 flex-1 md:max-w-none">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 md:block">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-foreground">{displayTitle}</p>
                <p className="mt-1 truncate text-xs font-medium text-muted-foreground md:text-sm">
                  {displaySubtitle}
                </p>
              </div>

              <p
                className={
                  transaction.direction === 'credit'
                    ? 'shrink-0 text-sm font-semibold text-success md:hidden'
                    : 'shrink-0 text-sm font-semibold text-danger md:hidden'
                }
              >
                {formatSignedTransactionMoney(transaction)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-muted px-2.5 py-1 text-xs font-bold text-foreground-accent">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {transaction.currency}
            </span>
            <Badge tone={getToneFromStatus(transaction.status)}>
              {toTitleCase(transaction.status)}
            </Badge>
          </div>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {mobilePostedDate}
          </span>
        </div>

        <div className="hidden items-center gap-2 text-sm font-bold text-foreground-muted md:flex">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{transaction.currency}</span>
        </div>

        <div className="hidden text-left md:block md:text-right">
          <p
            className={
              transaction.direction === 'credit'
                ? 'text-sm font-semibold text-success'
                : 'text-sm font-semibold text-danger'
            }
          >
            {formatSignedTransactionMoney(transaction)}
          </p>
        </div>

        <div className="hidden text-sm font-semibold text-muted-foreground md:block md:text-right">
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

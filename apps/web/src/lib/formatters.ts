import type { MoneyDto } from '@/api';

export function toTitleCase(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return value
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatMoneyFromMinor(amountMinor: bigint, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(Number(amountMinor) / 100);
}

export function formatMoney(money: MoneyDto): string {
  return formatMoneyFromMinor(BigInt(money.amountMinor), money.currency);
}

export function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!value) {
    return 'Waiting for sync';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    ...options,
  }).format(new Date(value));
}

export function shortenIdentifier(value: string): string {
  return value.length <= 14 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export function getToneFromStatus(value: string): 'default' | 'positive' | 'warning' {
  const normalizedValue = value.toLowerCase();

  if (
    normalizedValue.includes('ok') ||
    normalizedValue.includes('active') ||
    normalizedValue.includes('completed')
  ) {
    return 'positive';
  }

  if (normalizedValue.includes('pending') || normalizedValue.includes('limited')) {
    return 'warning';
  }

  return 'default';
}

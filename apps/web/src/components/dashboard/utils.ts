import type { LucideIcon } from 'lucide-react';
import { DollarSign, Euro, PoundSterling, Wallet } from 'lucide-react';

import type { FundingDetailValue, MoneyDto, TransactionItem, WalletBalance } from '../../api';
import type { TransactionFilter } from '../../store/dashboard-store';

export type SummaryMetric = {
  label: string;
  note: string;
  tone: 'blue' | 'emerald' | 'amber' | 'slate';
  value: string;
};

const placeholderUsdRates: Record<string, number> = {
  AUD: 0.65,
  EUR: 1.08,
  GBP: 1.27,
  JPY: 0.0067,
  SGD: 0.74,
  USD: 1,
  VND: 0.000039,
};

const currencyFlags: Record<string, string> = {
  AUD: 'AU',
  EUR: 'EU',
  GBP: 'GB',
  JPY: 'JP',
  SGD: 'SG',
  USD: 'US',
  VND: 'VN',
};

export const transactionFilters: Array<{ label: string; value: TransactionFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Inflow', value: 'credit' },
  { label: 'Outflow', value: 'debit' },
];

export function toTitleCase(value: string): string {
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

export function formatUsdAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(amount);
}

export function formatSignedTransactionMoney(item: TransactionItem): string {
  const amountMinor = BigInt(item.amounts.net.amountMinor);
  const signedMinor = item.direction === 'debit' ? -amountMinor : amountMinor;

  return formatMoneyFromMinor(signedMinor, item.amounts.net.currency);
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

export function getCurrencyIcon(currency: string): LucideIcon {
  switch (currency) {
    case 'USD':
      return DollarSign;
    case 'EUR':
      return Euro;
    case 'GBP':
      return PoundSterling;
    default:
      return Wallet;
  }
}

export function getCurrencyFlag(currency: string): string {
  return currencyFlags[currency] ?? currency.slice(0, 2);
}

function getPlaceholderUsdRate(currency: string): number {
  return placeholderUsdRates[currency] ?? 1;
}

function getAmountFromMinor(amountMinor: string): number {
  return Number(amountMinor) / 100;
}

export function getUsdEquivalentFromMoney(money: MoneyDto): number {
  return getAmountFromMinor(money.amountMinor) * getPlaceholderUsdRate(money.currency);
}

export function formatUsdRate(currency: string): string {
  const usdRate = getPlaceholderUsdRate(currency);
  const digits = usdRate < 0.01 ? 4 : 2;

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    style: 'currency',
  }).format(usdRate);
}

export function formatFundingDetailFieldLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[_\s-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(' ');
}

export function formatFundingDetailFieldValue(value: FundingDetailValue): string {
  if (value === null) {
    return 'Not provided';
  }

  return String(value);
}

export function includesSearchMatch(
  values: Array<string | null | undefined>,
  query: string,
): boolean {
  if (query.length === 0) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(query));
}

export function getCurrencyChipClasses(currency: string, isActive: boolean): string {
  if (currency === 'all') {
    return isActive
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-700';
  }

  if (currency === 'USD') {
    return isActive
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-white text-slate-700';
  }

  if (currency === 'EUR') {
    return isActive
      ? 'border-sky-300 bg-sky-50 text-sky-700'
      : 'border-slate-200 bg-white text-slate-700';
  }

  return isActive
    ? 'border-slate-300 bg-slate-100 text-slate-900'
    : 'border-slate-200 bg-white text-slate-700';
}

export function getAvailableCurrencies(
  balances: WalletBalance[],
  transactions: TransactionItem[],
): string[] {
  return [
    ...new Set([
      ...balances.map((balance) => balance.currency),
      ...transactions.map((transaction) => transaction.currency),
    ]),
  ].sort((left, right) => left.localeCompare(right));
}

export function sumBalanceUsdEquivalent(
  balances: WalletBalance[],
  field: 'available' | 'pending',
): number {
  return balances.reduce((sum, balance) => sum + getUsdEquivalentFromMoney(balance[field]), 0);
}

function getTransactionTimestamp(transaction: TransactionItem): number | null {
  const timestamp = transaction.postedAt ?? transaction.occurredAt;

  if (!timestamp) {
    return null;
  }

  const milliseconds = new Date(timestamp).getTime();

  return Number.isNaN(milliseconds) ? null : milliseconds;
}

export function sumTransactionsUsdEquivalent(
  transactions: TransactionItem[],
  direction: 'credit' | 'debit',
  windowStartTimestamp: number,
): number {
  return transactions.reduce((sum, transaction) => {
    const transactionTimestamp = getTransactionTimestamp(transaction);

    if (
      transaction.direction !== direction ||
      transactionTimestamp === null ||
      transactionTimestamp < windowStartTimestamp
    ) {
      return sum;
    }

    return sum + getUsdEquivalentFromMoney(transaction.amounts.net);
  }, 0);
}

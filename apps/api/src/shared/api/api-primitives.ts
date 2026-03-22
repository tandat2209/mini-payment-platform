export type MoneyDto = {
  amountMinor: string;
  currency: string;
};

export type CursorPageDto<T> = {
  items: T[];
  page: {
    limit: number;
    nextCursor: string | null;
  };
};

export function toMoneyDto(currency: string, amountMinor: bigint | number | string): MoneyDto {
  return {
    amountMinor: typeof amountMinor === 'bigint' ? amountMinor.toString() : String(amountMinor),
    currency,
  };
}

export function toIsoTimestamp(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

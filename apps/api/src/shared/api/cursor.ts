import { BadRequestException } from '@nestjs/common';

export type TransactionCursor = {
  id: string;
  occurredAt: string;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function encodeTransactionCursor(cursor: TransactionCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

export function decodeTransactionCursor(rawCursor?: string): TransactionCursor | null {
  if (!rawCursor) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8')) as {
      id?: unknown;
      occurredAt?: unknown;
    };

    if (typeof parsed.id !== 'string' || typeof parsed.occurredAt !== 'string') {
      throw new Error('Invalid cursor payload');
    }

    return {
      id: parsed.id,
      occurredAt: parsed.occurredAt,
    } satisfies TransactionCursor;
  } catch {
    throw new BadRequestException('Invalid transaction cursor');
  }
}

export function parseLimit(rawLimit?: string): number {
  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(rawLimit);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new BadRequestException(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }

  return parsed;
}

export function parseOptionalDate(rawValue: string | undefined, fieldName: string): string | null {
  if (!rawValue) {
    return null;
  }

  const value = new Date(rawValue);

  if (Number.isNaN(value.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date`);
  }

  return value.toISOString();
}

export function parseCurrency(rawCurrency?: string): string | null {
  if (!rawCurrency) {
    return null;
  }

  const normalized = rawCurrency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new BadRequestException('currency must be a 3-letter ISO code');
  }

  return normalized;
}

export function parsePositiveInteger(rawValue: string, fieldName: string): number {
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

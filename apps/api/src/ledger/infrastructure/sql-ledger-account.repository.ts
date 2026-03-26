import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type LedgerAccountRepository } from '../domain/ledger.repositories';

type LedgerAccountRow = {
  id: string;
};

@Injectable()
export class SqlLedgerAccountRepository implements LedgerAccountRepository {
  async findOpenWalletLiabilityAccount(
    context: TransactionContext,
    walletId: string,
    currency: string,
  ): Promise<string | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<LedgerAccountRow>(
      `
        SELECT id
        FROM ledger_accounts
        WHERE owner_type = 'wallet'
          AND owner_id = $1::uuid
          AND currency = $2
          AND account_type = 'liability'
          AND status = 'open'
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [walletId, currency],
    );

    return result.rows[0]?.id ?? null;
  }

  async createWalletLiabilityAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
      walletId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        INSERT INTO ledger_accounts (
          id,
          code,
          name,
          account_type,
          owner_type,
          owner_id,
          currency,
          status,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'liability',
          'wallet',
          $4::uuid,
          $5,
          'open',
          '{}'::jsonb,
          $6::timestamptz,
          $6::timestamptz
        )
        ON CONFLICT (code) DO NOTHING
      `,
      [randomUUID(), input.code, input.name, input.walletId, input.currency, input.now],
    );
  }

  async findOpenRecipientPayableAccount(
    context: TransactionContext,
    recipientId: string,
    currency: string,
  ): Promise<string | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<LedgerAccountRow>(
      `
        SELECT id
        FROM ledger_accounts
        WHERE owner_type = 'recipient'
          AND owner_id = $1::uuid
          AND currency = $2
          AND account_type = 'liability'
          AND status = 'open'
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [recipientId, currency],
    );

    return result.rows[0]?.id ?? null;
  }

  async createRecipientPayableAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
      recipientId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        INSERT INTO ledger_accounts (
          id,
          code,
          name,
          account_type,
          owner_type,
          owner_id,
          currency,
          status,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'liability',
          'recipient',
          $4::uuid,
          $5,
          'open',
          '{}'::jsonb,
          $6::timestamptz,
          $6::timestamptz
        )
        ON CONFLICT (code) DO NOTHING
      `,
      [randomUUID(), input.code, input.name, input.recipientId, input.currency, input.now],
    );
  }

  async findOpenPlatformCashAccount(
    context: TransactionContext,
    currency: string,
  ): Promise<string | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<LedgerAccountRow>(
      `
        SELECT id
        FROM ledger_accounts
        WHERE owner_type = 'platform'
          AND owner_id IS NULL
          AND currency = $1
          AND account_type = 'asset'
          AND status = 'open'
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [currency],
    );

    return result.rows[0]?.id ?? null;
  }

  async findOpenPlatformRevenueAccount(
    context: TransactionContext,
    currency: string,
  ): Promise<string | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<LedgerAccountRow>(
      `
        SELECT id
        FROM ledger_accounts
        WHERE owner_type = 'platform'
          AND owner_id IS NULL
          AND currency = $1
          AND account_type = 'revenue'
          AND status = 'open'
        ORDER BY created_at ASC
        LIMIT 1
      `,
      [currency],
    );

    return result.rows[0]?.id ?? null;
  }

  async createPlatformCashAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        INSERT INTO ledger_accounts (
          id,
          code,
          name,
          account_type,
          owner_type,
          owner_id,
          currency,
          status,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'asset',
          'platform',
          NULL,
          $4,
          'open',
          '{}'::jsonb,
          $5::timestamptz,
          $5::timestamptz
        )
        ON CONFLICT (code) DO NOTHING
      `,
      [randomUUID(), input.code, input.name, input.currency, input.now],
    );
  }

  async createPlatformRevenueAccount(
    context: TransactionContext,
    input: {
      code: string;
      currency: string;
      name: string;
      now: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        INSERT INTO ledger_accounts (
          id,
          code,
          name,
          account_type,
          owner_type,
          owner_id,
          currency,
          status,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'revenue',
          'platform',
          NULL,
          $4,
          'open',
          '{}'::jsonb,
          $5::timestamptz,
          $5::timestamptz
        )
        ON CONFLICT (code) DO NOTHING
      `,
      [randomUUID(), input.code, input.name, input.currency, input.now],
    );
  }
}

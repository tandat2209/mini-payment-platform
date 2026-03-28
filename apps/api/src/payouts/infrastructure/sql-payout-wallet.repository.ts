import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type OwnedWalletBalance,
  type PayoutWalletRepository,
} from '../domain/payout-write.repositories';

type OwnedWalletBalanceRow = {
  available_amount_minor: string;
  wallet_id: string;
};

@Injectable()
export class SqlPayoutWalletRepository implements PayoutWalletRepository {
  async creditAvailableBalance(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      updatedAt: string;
      walletId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        INSERT INTO wallet_balances (
          id,
          wallet_id,
          currency,
          available_amount_minor,
          pending_amount_minor,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          0,
          $5::timestamptz,
          $5::timestamptz
        )
        ON CONFLICT (wallet_id, currency) DO UPDATE
        SET
          available_amount_minor = wallet_balances.available_amount_minor + EXCLUDED.available_amount_minor,
          updated_at = EXCLUDED.updated_at
      `,
      [randomUUID(), input.walletId, input.currency, input.amountMinor, input.updatedAt],
    );
  }

  async findOwnedActiveWalletBalance(
    context: TransactionContext,
    input: {
      currency: string;
      customerId: string;
      walletId: string;
    },
  ): Promise<OwnedWalletBalance | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<OwnedWalletBalanceRow>(
      `
        SELECT
          w.id AS wallet_id,
          wb.available_amount_minor::text AS available_amount_minor
        FROM wallets w
        JOIN wallet_balances wb
          ON wb.wallet_id = w.id
        WHERE w.user_id = $1::uuid
          AND w.id = $2::uuid
          AND w.status = 'active'
          AND wb.currency = $3
        LIMIT 1
      `,
      [input.customerId, input.walletId, input.currency],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      availableAmountMinor: Number(row.available_amount_minor),
      walletId: row.wallet_id,
    };
  }

  async debitAvailableBalance(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      updatedAt: string;
      walletId: string;
    },
  ): Promise<boolean> {
    const database = getDatabaseQueryable(context);
    const result = await database.query(
      `
        UPDATE wallet_balances
        SET
          available_amount_minor = available_amount_minor - $3,
          updated_at = $4::timestamptz
        WHERE wallet_id = $1::uuid
          AND currency = $2
          AND available_amount_minor >= $3
      `,
      [input.walletId, input.currency, input.amountMinor, input.updatedAt],
    );

    return result.rowCount === 1;
  }
}

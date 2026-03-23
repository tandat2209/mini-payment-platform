import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type WalletBalanceWriter } from '../domain/funding.repositories';

@Injectable()
export class SqlWalletBalanceWriter implements WalletBalanceWriter {
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
}

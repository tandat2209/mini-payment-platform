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

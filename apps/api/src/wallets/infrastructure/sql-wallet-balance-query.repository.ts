import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type WalletBalanceQueryRepository,
  type WalletBalanceView,
} from '../domain/wallet-balance-query.repository';

type BalanceRow = {
  available_amount_minor: string | null;
  currency: string | null;
  pending_amount_minor: string | null;
  updated_at: Date | string | null;
  wallet_id: string;
  wallet_status: string;
};

@Injectable()
export class SqlWalletBalanceQueryRepository implements WalletBalanceQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getActiveWalletBalances(customerId: string): Promise<WalletBalanceView | null> {
    const result = await this.databaseService.query<BalanceRow>(
      `
        SELECT
          w.id AS wallet_id,
          w.status AS wallet_status,
          wb.currency,
          wb.available_amount_minor::text AS available_amount_minor,
          wb.pending_amount_minor::text AS pending_amount_minor,
          wb.updated_at
        FROM wallets w
        LEFT JOIN wallet_balances wb
          ON wb.wallet_id = w.id
        WHERE w.user_id = $1
          AND w.status = 'active'
        ORDER BY wb.currency ASC NULLS LAST
      `,
      [customerId],
    );

    const firstRow = result.rows[0];

    if (!firstRow) {
      return null;
    }

    return {
      balances: result.rows
        .filter((row) => row.currency !== null)
        .map((row) => ({
          availableAmountMinor: row.available_amount_minor ?? '0',
          currency: row.currency ?? 'USD',
          pendingAmountMinor: row.pending_amount_minor ?? '0',
          updatedAt: row.updated_at,
        })),
      walletId: firstRow.wallet_id,
      walletStatus: firstRow.wallet_status,
    };
  }
}

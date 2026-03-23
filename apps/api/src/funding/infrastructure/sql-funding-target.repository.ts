import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type FundingTarget, type FundingTargetRepository } from '../domain/funding.repositories';
import { type FundingWebhook } from '../domain/funding.types';

type FundingTargetRow = {
  user_id: string;
  wallet_id: string;
};

@Injectable()
export class SqlFundingTargetRepository implements FundingTargetRepository {
  async findActiveFundingTarget(
    context: TransactionContext,
    payload: FundingWebhook,
  ): Promise<FundingTarget | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<FundingTargetRow>(
      `
        SELECT
          u.id AS user_id,
          w.id AS wallet_id
        FROM users u
        JOIN wallets w
          ON w.user_id = u.id
         AND w.status = 'active'
        JOIN wallet_funding_details wfd
          ON wfd.wallet_id = w.id
         AND wfd.is_active = TRUE
        WHERE u.external_ref = $1
          AND wfd.id = $2
          AND wfd.currency = $3
        LIMIT 1
      `,
      [payload.data.customerExternalRef, payload.data.fundingDetailId, payload.data.currency],
    );
    const row = result.rows[0];

    return row
      ? {
          userId: row.user_id,
          walletId: row.wallet_id,
        }
      : null;
  }
}

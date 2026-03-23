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
    const { destinationIdentifierPredicate, destinationRailPredicate } = getDestinationLookup(
      payload.data.destinationType,
    );
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
        WHERE w.status = 'active'
          AND wfd.currency = $2
          AND ${destinationIdentifierPredicate}
          ${destinationRailPredicate}
        LIMIT 1
      `,
      [payload.data.destinationIdentifier, payload.data.currency],
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

function getDestinationLookup(destinationType: FundingWebhook['data']['destinationType']): {
  destinationIdentifierPredicate: string;
  destinationRailPredicate: string;
} {
  switch (destinationType) {
    case 'account_number':
      return {
        destinationIdentifierPredicate: "wfd.details->>'accountNumber' = $1",
        destinationRailPredicate: '',
      };
    case 'iban':
      return {
        destinationIdentifierPredicate: "UPPER(wfd.details->>'iban') = UPPER($1)",
        destinationRailPredicate: '',
      };
    case 'virtual_account':
      return {
        destinationIdentifierPredicate:
          "COALESCE(wfd.details->>'virtualAccountNumber', wfd.details->>'accountNumber') = $1",
        destinationRailPredicate: "AND (wfd.rail = 'virtual_account' OR wfd.rail = 'virtual_iban')",
      };
  }
}

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type FundingTransactionWriter } from '../domain/funding.repositories';

@Injectable()
export class SqlFundingTransactionWriter implements FundingTransactionWriter {
  async createFundingTransaction(
    context: TransactionContext,
    input: {
      amountMinor: number;
      currency: string;
      occurredAt: string;
      postedAt: string;
      reference: string;
      userId: string;
      walletId: string;
      webhookEventId: string;
    },
  ): Promise<string> {
    const database = getDatabaseQueryable(context);
    const userTransactionId = randomUUID();
    await database.query(
      `
        INSERT INTO user_transactions (
          id,
          user_id,
          wallet_id,
          webhook_event_id,
          type,
          direction,
          status,
          currency,
          gross_amount_minor,
          fee_amount_minor,
          net_amount_minor,
          description,
          reference,
          occurred_at,
          posted_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          'funding',
          'credit',
          'completed',
          $5,
          $6,
          0,
          $6,
          'Funding received',
          $7,
          $8::timestamptz,
          $9::timestamptz,
          $9::timestamptz,
          $9::timestamptz
        )
      `,
      [
        userTransactionId,
        input.userId,
        input.walletId,
        input.webhookEventId,
        input.currency,
        input.amountMinor,
        input.reference,
        input.occurredAt,
        input.postedAt,
      ],
    );

    return userTransactionId;
  }
}

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type LedgerPostingRepository } from '../domain/ledger.repositories';
import { type CreatePostedLedgerTransactionInput } from '../domain/ledger.types';

@Injectable()
export class SqlLedgerPostingRepository implements LedgerPostingRepository {
  async createPostedTransaction(
    context: TransactionContext,
    input: CreatePostedLedgerTransactionInput,
  ): Promise<string> {
    const database = getDatabaseQueryable(context);
    const ledgerTransactionId = randomUUID();

    await database.query(
      `
        INSERT INTO ledger_transactions (
          id,
          user_transaction_id,
          webhook_event_id,
          transaction_type,
          status,
          currency,
          reference,
          description,
          created_at,
          posted_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3::uuid,
          $4,
          'posted',
          $5,
          $6,
          $7,
          $8::timestamptz,
          $8::timestamptz
        )
      `,
      [
        ledgerTransactionId,
        input.userTransactionId ?? null,
        input.webhookEventId ?? null,
        input.transactionType,
        input.currency,
        input.reference,
        input.description,
        input.postedAt,
      ],
    );

    const valuesSql = input.entries
      .map(
        (_entry, index) => `
          (
            $${index * 7 + 1},
            $${index * 7 + 2}::uuid,
            $${index * 7 + 3}::uuid,
            $${index * 7 + 4},
            $${index * 7 + 5},
            $${index * 7 + 6},
            $${index * 7 + 7},
            $${input.entries.length * 7 + 1}::timestamptz
          )`,
      )
      .join(',\n');

    const parameters = input.entries.flatMap((entry) => [
      randomUUID(),
      ledgerTransactionId,
      entry.ledgerAccountId,
      entry.direction,
      entry.currency,
      entry.amountMinor,
      entry.description,
    ]);

    await database.query(
      `
        INSERT INTO ledger_entries (
          id,
          ledger_transaction_id,
          ledger_account_id,
          direction,
          currency,
          amount_minor,
          description,
          created_at
        )
        VALUES ${valuesSql}
      `,
      [...parameters, input.postedAt],
    );

    return ledgerTransactionId;
  }
}

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type PayoutExecutionRecord,
  type PayoutWriteRepository,
} from '../domain/payout-write.repositories';

type PayoutExecutionRow = {
  attempt_id: string;
  attempt_status: PayoutExecutionRecord['attemptStatus'];
  currency: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  net_amount_minor: string;
  payout_id: string;
  payout_reference: string | null;
  payout_status: PayoutExecutionRecord['payoutStatus'];
  provider: string;
  recipient_id: string;
  user_id: string;
  user_transaction_id: string;
  wallet_id: string;
};

@Injectable()
export class SqlPayoutWriteRepository implements PayoutWriteRepository {
  async createPayoutBooking(
    context: TransactionContext,
    input: {
      createdAt: string;
      currency: string;
      description: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      idempotencyKeyId?: string | null;
      netAmountMinor: number;
      occurredAt: string;
      payoutId: string;
      rail: string;
      recipientId: string;
      recipientRailId: string;
      reference: string;
      userId: string;
      userTransactionId: string;
      walletId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

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
          $1::uuid,
          $2::uuid,
          $3::uuid,
          NULL,
          'payout',
          'debit',
          'pending',
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::timestamptz,
          $11::timestamptz,
          $11::timestamptz,
          $11::timestamptz
        )
      `,
      [
        input.userTransactionId,
        input.userId,
        input.walletId,
        input.currency,
        input.grossAmountMinor,
        input.feeAmountMinor,
        input.netAmountMinor,
        input.description,
        input.reference,
        input.occurredAt,
        input.createdAt,
      ],
    );

    await database.query(
      `
        INSERT INTO payouts (
          id,
          user_id,
          wallet_id,
          recipient_id,
          recipient_rail_id,
          user_transaction_id,
          idempotency_key_id,
          rail,
          status,
          currency,
          gross_amount_minor,
          fee_amount_minor,
          net_amount_minor,
          reference,
          created_at,
          updated_at,
          submitted_at,
          completed_at,
          failed_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6::uuid,
          $7::uuid,
          $8,
          'pending_submission',
          $9,
          $10,
          $11,
          $12,
          $13,
          $14::timestamptz,
          $14::timestamptz,
          NULL,
          NULL,
          NULL
        )
      `,
      [
        input.payoutId,
        input.userId,
        input.walletId,
        input.recipientId,
        input.recipientRailId,
        input.userTransactionId,
        input.idempotencyKeyId ?? null,
        input.rail,
        input.currency,
        input.grossAmountMinor,
        input.feeAmountMinor,
        input.netAmountMinor,
        input.reference,
        input.createdAt,
      ],
    );
  }

  async findExecutionByProviderPayoutId(
    context: TransactionContext,
    input: {
      externalPayoutId: string;
      provider: string;
    },
  ): Promise<PayoutExecutionRecord | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<PayoutExecutionRow>(
      `
        SELECT
          pa.id AS attempt_id,
          pa.status AS attempt_status,
          p.currency,
          p.fee_amount_minor::text AS fee_amount_minor,
          p.gross_amount_minor::text AS gross_amount_minor,
          p.net_amount_minor::text AS net_amount_minor,
          p.id AS payout_id,
          p.reference AS payout_reference,
          p.status AS payout_status,
          pa.provider,
          p.recipient_id,
          p.user_id,
          p.user_transaction_id,
          p.wallet_id
        FROM payout_attempts pa
        INNER JOIN payouts p
          ON p.id = pa.payout_id
        WHERE pa.provider = $1
          AND pa.external_payout_id = $2
        ORDER BY pa.created_at DESC
        LIMIT 1
      `,
      [input.provider, input.externalPayoutId],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      attemptId: row.attempt_id,
      attemptStatus: row.attempt_status,
      currency: row.currency,
      feeAmountMinor: Number(row.fee_amount_minor),
      grossAmountMinor: Number(row.gross_amount_minor),
      netAmountMinor: Number(row.net_amount_minor),
      payoutId: row.payout_id,
      payoutReference: row.payout_reference,
      payoutStatus: row.payout_status,
      provider: row.provider,
      recipientId: row.recipient_id,
      userId: row.user_id,
      userTransactionId: row.user_transaction_id,
      walletId: row.wallet_id,
    };
  }

  async markPayoutAsFailed(
    context: TransactionContext,
    input: {
      failedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payouts
        SET status = 'failed',
            failed_at = $2::timestamptz,
            updated_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [input.payoutId, input.failedAt, input.updatedAt],
    );

    await database.query(
      `
        UPDATE user_transactions
        SET status = 'failed',
            webhook_event_id = $2::uuid,
            updated_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [input.userTransactionId, input.webhookEventId, input.updatedAt],
    );
  }

  async markPayoutAsPaid(
    context: TransactionContext,
    input: {
      completedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payouts
        SET status = 'paid',
            completed_at = $2::timestamptz,
            updated_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [input.payoutId, input.completedAt, input.updatedAt],
    );

    await database.query(
      `
        UPDATE user_transactions
        SET status = 'completed',
            webhook_event_id = $2::uuid,
            posted_at = $3::timestamptz,
            updated_at = $4::timestamptz
        WHERE id = $1::uuid
      `,
      [input.userTransactionId, input.webhookEventId, input.completedAt, input.updatedAt],
    );
  }

  async markPayoutAsProcessing(
    context: TransactionContext,
    input: {
      payoutId: string;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payouts
        SET status = 'processing',
            updated_at = $2::timestamptz
        WHERE id = $1::uuid
      `,
      [input.payoutId, input.updatedAt],
    );
  }

  async markPayoutAsReturned(
    context: TransactionContext,
    input: {
      payoutId: string;
      userTransactionId: string;
      webhookEventId: string;
      returnedAmountMinor: number;
      returnedAt: string;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payouts
        SET status = 'returned',
            returned_at = $2::timestamptz,
            returned_amount_minor = $3,
            updated_at = $4::timestamptz
        WHERE id = $1::uuid
      `,
      [input.payoutId, input.returnedAt, input.returnedAmountMinor, input.updatedAt],
    );

    await database.query(
      `
        UPDATE user_transactions
        SET status = 'returned',
            webhook_event_id = $2::uuid,
            updated_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [input.userTransactionId, input.webhookEventId, input.updatedAt],
    );
  }

  async createReturnedPayoutCreditTransaction(
    context: TransactionContext,
    input: {
      amountMinor: number;
      createdAt: string;
      currency: string;
      description: string;
      occurredAt: string;
      payoutId: string;
      reference: string | null;
      userId: string;
      userTransactionId: string;
      walletId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        INSERT INTO user_transactions (
          id,
          user_id,
          wallet_id,
          webhook_event_id,
          related_payout_id,
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
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          'reversal',
          'credit',
          'completed',
          $6,
          $7,
          0,
          $7,
          $8,
          $9,
          $10::timestamptz,
          $10::timestamptz,
          $11::timestamptz,
          $11::timestamptz
        )
      `,
      [
        input.userTransactionId,
        input.userId,
        input.walletId,
        input.webhookEventId,
        input.payoutId,
        input.currency,
        input.amountMinor,
        input.description,
        input.reference,
        input.occurredAt,
        input.createdAt,
      ],
    );
  }

  async recordSubmissionAttempt(
    context: TransactionContext,
    input: {
      attemptId: string;
      externalPayoutId: string;
      externalRequestId: string;
      idempotencyKeyId?: string | null;
      payoutId: string;
      provider: string;
      requestPayload: Record<string, unknown>;
      responsePayload: Record<string, unknown>;
      status: 'accepted';
      submittedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        INSERT INTO payout_attempts (
          id,
          payout_id,
          idempotency_key_id,
          provider,
          external_request_id,
          external_payout_id,
          status,
          request_payload,
          response_payload,
          submitted_at,
          resolved_at,
          created_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          $5,
          $6,
          $7,
          $8::jsonb,
          $9::jsonb,
          $10::timestamptz,
          NULL,
          $10::timestamptz
        )
      `,
      [
        input.attemptId,
        input.payoutId,
        input.idempotencyKeyId ?? null,
        input.provider,
        input.externalRequestId,
        input.externalPayoutId,
        input.status,
        JSON.stringify(input.requestPayload),
        JSON.stringify(input.responsePayload),
        input.submittedAt,
      ],
    );
  }

  async updatePayoutAfterSubmission(
    context: TransactionContext,
    input: {
      payoutId: string;
      status: 'submitted';
      submittedAt: string;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payouts
        SET status = $2,
            submitted_at = $3::timestamptz,
            updated_at = $4::timestamptz
        WHERE id = $1::uuid
      `,
      [input.payoutId, input.status, input.submittedAt, input.updatedAt],
    );
  }

  async updateAttemptOutcome(
    context: TransactionContext,
    input: {
      attemptId: string;
      responsePayload: Record<string, unknown>;
      resolvedAt?: string;
      status: 'failed' | 'processing' | 'succeeded';
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE payout_attempts
        SET status = $2,
            response_payload = COALESCE(response_payload, '{}'::jsonb) || $3::jsonb,
            resolved_at = $4::timestamptz
        WHERE id = $1::uuid
      `,
      [
        input.attemptId,
        input.status,
        JSON.stringify(input.responsePayload),
        input.resolvedAt ?? null,
      ],
    );
  }
}

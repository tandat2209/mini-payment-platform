import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type PayoutWriteRepository } from '../domain/payout-write.repositories';

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
}

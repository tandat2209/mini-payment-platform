import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type ClaimedPayoutIdempotencyKey,
  type PayoutIdempotencyRepository,
} from '../domain/payout-idempotency.repository';
import { type CreatedPayout } from '../domain/payout-write.types';

type IdempotencyRow = {
  id: string;
  request_fingerprint: string | null;
  response_payload: CreatedPayout | null;
  status: 'completed' | 'created' | 'failed';
};

@Injectable()
export class SqlPayoutIdempotencyRepository implements PayoutIdempotencyRepository {
  async claimKey(
    context: TransactionContext,
    input: {
      createdAt: string;
      key: string;
      requestFingerprint: string;
      scope: string;
    },
  ): Promise<ClaimedPayoutIdempotencyKey> {
    const database = getDatabaseQueryable(context);
    const insertResult = await database.query<IdempotencyRow>(
      `
        INSERT INTO idempotency_keys (
          id,
          scope,
          key,
          status,
          request_fingerprint,
          response_payload,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2,
          $3,
          'created',
          $4,
          NULL,
          $5::timestamptz,
          $5::timestamptz
        )
        ON CONFLICT (scope, key) DO NOTHING
        RETURNING id, status, request_fingerprint, response_payload
      `,
      [randomUUID(), input.scope, input.key, input.requestFingerprint, input.createdAt],
    );
    const inserted = insertResult.rows[0];

    if (inserted) {
      return {
        id: inserted.id,
        result: 'claimed',
      };
    }

    const existingResult = await database.query<IdempotencyRow>(
      `
        SELECT id, status, request_fingerprint, response_payload
        FROM idempotency_keys
        WHERE scope = $1
          AND key = $2
        LIMIT 1
      `,
      [input.scope, input.key],
    );
    const existing = existingResult.rows[0];

    if (!existing) {
      throw new Error('Idempotency key could not be loaded after conflict');
    }

    return {
      id: existing.id,
      requestFingerprint: existing.request_fingerprint,
      responsePayload: existing.response_payload,
      result: 'existing',
      status: existing.status,
    };
  }

  async markCompleted(
    context: TransactionContext,
    input: {
      id: string;
      responsePayload: CreatedPayout;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        UPDATE idempotency_keys
        SET
          status = 'completed',
          response_payload = $2::jsonb,
          updated_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [input.id, JSON.stringify(input.responsePayload), input.updatedAt],
    );
  }
}

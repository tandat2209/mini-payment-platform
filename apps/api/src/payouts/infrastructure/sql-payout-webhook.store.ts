import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import { type PayoutWebhookStore } from '../domain/payout-webhook.store';
import {
  type PayoutWebhook,
  type RecordedPayoutWebhookEvent,
} from '../domain/payout-webhook.types';

type WebhookEventRow = {
  event_type: string;
  external_event_id: string;
  id: string;
  processing_status: string;
  provider: string;
  received_at: Date | string | null;
};

@Injectable()
export class SqlPayoutWebhookStore implements PayoutWebhookStore {
  async recordReceived(
    context: TransactionContext,
    payload: PayoutWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedPayoutWebhookEvent | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<WebhookEventRow>(
      `
        INSERT INTO webhook_events (
          id,
          provider,
          external_event_id,
          event_type,
          processing_status,
          signature_verified,
          payload,
          received_at,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'received',
          TRUE,
          $5::jsonb,
          $6::timestamptz,
          $6::timestamptz
        )
        ON CONFLICT (provider, external_event_id) DO NOTHING
        RETURNING
          id,
          provider,
          external_event_id,
          event_type,
          processing_status,
          received_at
      `,
      [
        webhookId,
        payload.provider,
        payload.externalEventId,
        payload.eventType,
        JSON.stringify(payload),
        receivedAt,
      ],
    );

    return mapRecordedWebhookEvent(result.rows[0], false);
  }

  async findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedPayoutWebhookEvent | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<WebhookEventRow>(
      `
        SELECT
          id,
          provider,
          external_event_id,
          event_type,
          processing_status,
          received_at
        FROM webhook_events
        WHERE provider = $1
          AND external_event_id = $2
        LIMIT 1
      `,
      [provider, externalEventId],
    );

    return mapRecordedWebhookEvent(result.rows[0], false);
  }

  async markProcessingStatus(
    context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedPayoutWebhookEvent> {
    const database = getDatabaseQueryable(context);
    await database.query(
      `
        UPDATE webhook_events
        SET processing_status = $2,
            processed_at = $3::timestamptz
        WHERE id = $1::uuid
      `,
      [webhookId, processingStatus, processedAt],
    );

    const result = await database.query<WebhookEventRow>(
      `
        SELECT
          id,
          provider,
          external_event_id,
          event_type,
          processing_status,
          received_at
        FROM webhook_events
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [webhookId],
    );
    const event = mapRecordedWebhookEvent(result.rows[0], false);

    if (!event) {
      throw new Error('Payout webhook event could not be loaded after status update');
    }

    return event;
  }
}

function mapRecordedWebhookEvent(
  row: WebhookEventRow | undefined,
  duplicate: boolean,
): RecordedPayoutWebhookEvent | null {
  if (!row) {
    return null;
  }

  return {
    duplicate,
    eventType: row.event_type,
    externalEventId: row.external_event_id,
    id: row.id,
    processingStatus: row.processing_status,
    provider: row.provider,
    receivedAt: row.received_at,
  };
}

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type FundingWebhook,
  type FundingWebhookRepository,
  type RecordedWebhookEvent,
} from '../domain/funding-webhook.repository';

type WebhookEventRow = {
  event_type: string;
  external_event_id: string;
  id: string;
  processing_status: string;
  provider: string;
  received_at: Date | string | null;
};

@Injectable()
export class SqlFundingWebhookRepository implements FundingWebhookRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async recordReceivedFundingWebhook(payload: FundingWebhook): Promise<RecordedWebhookEvent> {
    const webhookId = randomUUID();
    const receivedAt = new Date().toISOString();
    const insertedResult = await this.databaseService.query<WebhookEventRow>(
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
          $2,
          $3,
          'received',
          TRUE,
          $4::jsonb,
          $5::timestamptz,
          $5::timestamptz
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

    const insertedRow = insertedResult.rows[0];

    if (insertedRow) {
      return {
        duplicate: false,
        eventType: insertedRow.event_type,
        externalEventId: insertedRow.external_event_id,
        id: insertedRow.id,
        processingStatus: insertedRow.processing_status,
        provider: insertedRow.provider,
        receivedAt: insertedRow.received_at,
      };
    }

    const existingResult = await this.databaseService.query<WebhookEventRow>(
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
      `,
      [payload.provider, payload.externalEventId],
    );

    const existingRow = existingResult.rows[0];

    if (!existingRow) {
      throw new Error('Webhook event could not be loaded after duplicate detection');
    }

    return {
      duplicate: true,
      eventType: existingRow.event_type,
      externalEventId: existingRow.external_event_id,
      id: existingRow.id,
      processingStatus: existingRow.processing_status,
      provider: existingRow.provider,
      receivedAt: existingRow.received_at,
    };
  }
}

import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type ReconciliationReportStore,
  type StoredReconciliationBatch,
} from '../domain/reconciliation-report.store';
import {
  type ReconciliationReportLine,
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
} from '../domain/reconciliation-report.types';

type WebhookEventRow = {
  event_type: string;
  external_event_id: string;
  id: string;
  processing_status: string;
  provider: string;
  received_at: Date | string | null;
};

type BatchRow = {
  id: string;
  provider: string;
  provider_report_id: string;
  received_at: Date | string;
};

@Injectable()
export class SqlReconciliationReportStore implements ReconciliationReportStore {
  async recordReceivedWebhook(
    context: TransactionContext,
    payload: ReconciliationReportWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedReconciliationReportEvent | null> {
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

    return mapRecordedWebhookEvent(result.rows[0], false, null);
  }

  async findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedReconciliationReportEvent | null> {
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

    return mapRecordedWebhookEvent(result.rows[0], false, null);
  }

  async recordBatch(
    context: TransactionContext,
    input: {
      batchId: string;
      lineCount: number;
      payload: ReconciliationReportWebhook;
      providerReportId: string;
      receivedAt: string;
      reportDate: string;
      reportWindowEnd: string;
      reportWindowStart: string;
      webhookEventId: string;
    },
  ): Promise<StoredReconciliationBatch | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<BatchRow>(
      `
        INSERT INTO reconciliation_report_batches (
          id,
          webhook_event_id,
          provider,
          provider_report_id,
          report_date,
          report_window_start,
          report_window_end,
          line_count,
          processing_status,
          raw_payload,
          received_at,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2::uuid,
          $3,
          $4,
          $5::date,
          $6::timestamptz,
          $7::timestamptz,
          $8,
          'received',
          $9::jsonb,
          $10::timestamptz,
          $10::timestamptz,
          $10::timestamptz
        )
        ON CONFLICT (provider, provider_report_id) DO NOTHING
        RETURNING
          id,
          provider,
          provider_report_id,
          received_at
      `,
      [
        input.batchId,
        input.webhookEventId,
        input.payload.provider,
        input.providerReportId,
        input.reportDate,
        input.reportWindowStart,
        input.reportWindowEnd,
        input.lineCount,
        JSON.stringify(input.payload),
        input.receivedAt,
      ],
    );

    return mapStoredBatch(result.rows[0]);
  }

  async findBatchByProviderReportId(
    context: TransactionContext,
    provider: string,
    providerReportId: string,
  ): Promise<StoredReconciliationBatch | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<BatchRow>(
      `
        SELECT
          id,
          provider,
          provider_report_id,
          received_at
        FROM reconciliation_report_batches
        WHERE provider = $1
          AND provider_report_id = $2
        LIMIT 1
      `,
      [provider, providerReportId],
    );

    return mapStoredBatch(result.rows[0]);
  }

  async recordLines(
    context: TransactionContext,
    batchId: string,
    lines: ReconciliationReportLine[],
    receivedAt: string,
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    for (const [lineIndex, line] of lines.entries()) {
      await database.query(
        `
          INSERT INTO reconciliation_report_lines (
            id,
            batch_id,
            line_index,
            provider_line_id,
            line_type,
            line_status,
            currency,
            gross_amount_minor,
            fee_amount_minor,
            net_amount_minor,
            returned_amount_minor,
            external_event_id,
            external_payout_id,
            external_request_id,
            provider_reference,
            internal_reference,
            customer_external_ref,
            wallet_id,
            event_timestamp,
            processing_status,
            raw_payload,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2::uuid,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18::uuid,
            $19::timestamptz,
            'received',
            $20::jsonb,
            $21::timestamptz,
            $21::timestamptz
          )
        `,
        [
          randomUUID(),
          batchId,
          lineIndex,
          line.lineId,
          line.lineType,
          line.status,
          line.currency,
          line.grossAmountMinor,
          line.feeAmountMinor,
          line.netAmountMinor,
          line.lineType === 'return' ? line.returnedAmountMinor : null,
          line.lineType === 'funding' ? line.externalEventId : null,
          line.lineType !== 'funding' ? line.externalPayoutId : null,
          line.lineType !== 'funding' ? line.externalRequestId : null,
          line.lineType === 'funding' ? line.providerReference : null,
          line.internalReference,
          line.customerExternalRef,
          line.walletId,
          line.eventTimestamp,
          JSON.stringify(line),
          receivedAt,
        ],
      );
    }
  }

  async markBatchAndLinesProcessed(
    context: TransactionContext,
    batchId: string,
    processedAt: string,
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE reconciliation_report_batches
        SET processing_status = 'processed',
            processed_at = $2::timestamptz,
            updated_at = $2::timestamptz
        WHERE id = $1::uuid
      `,
      [batchId, processedAt],
    );

    await database.query(
      `
        UPDATE reconciliation_report_lines
        SET processing_status = 'processed',
            processed_at = $2::timestamptz,
            updated_at = $2::timestamptz
        WHERE batch_id = $1::uuid
      `,
      [batchId, processedAt],
    );
  }

  async markWebhookProcessingStatus(
    context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedReconciliationReportEvent> {
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
    const event = mapRecordedWebhookEvent(result.rows[0], false, null);

    if (!event) {
      throw new Error(
        'Reconciliation report webhook event could not be loaded after status update',
      );
    }

    return event;
  }
}

function mapStoredBatch(row: BatchRow | undefined): StoredReconciliationBatch | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    provider: row.provider,
    providerReportId: row.provider_report_id,
    receivedAt: row.received_at,
  };
}

function mapRecordedWebhookEvent(
  row: WebhookEventRow | undefined,
  duplicate: boolean,
  providerReportId: string | null,
): RecordedReconciliationReportEvent | null {
  if (!row) {
    return null;
  }

  return {
    batchId: null,
    duplicate,
    eventType: row.event_type,
    externalEventId: row.external_event_id,
    id: row.id,
    processingStatus: row.processing_status,
    provider: row.provider,
    providerReportId,
    receivedAt: row.received_at,
  };
}

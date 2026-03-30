import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type ReconciliationReportStore,
  type StoredReconciliationBatch,
} from '../domain/reconciliation-report.store';
import {
  type FundingReconciliationMatchCandidate,
  type PayoutReconciliationMatchCandidate,
  type ReconciliationLineOutcome,
  type ReconciliationReportLine,
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
  type StoredReconciliationReportLine,
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

type StoredLineRow = {
  batch_id: string;
  currency: string;
  customer_external_ref: string;
  event_timestamp: Date | string;
  external_event_id: string | null;
  external_payout_id: string | null;
  external_request_id: string | null;
  fee_amount_minor: string;
  gross_amount_minor: string;
  id: string;
  internal_reference: string | null;
  line_index: number;
  line_status: string;
  line_type: StoredReconciliationReportLine['lineType'];
  net_amount_minor: string;
  payout_id: string | null;
  provider_line_id: string;
  returned_amount_minor: string | null;
  wallet_id: string | null;
};

type FundingMatchRow = {
  currency: string | null;
  fee_amount_minor: string | null;
  gross_amount_minor: string | null;
  ledger_transaction_id: string | null;
  ledger_transaction_status: string | null;
  net_amount_minor: string | null;
  user_transaction_id: string | null;
  user_transaction_status: string | null;
  webhook_event_id: string;
  webhook_processing_status: string;
};

type PayoutMatchRow = {
  attempt_status: string | null;
  currency: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  net_amount_minor: string;
  payout_attempt_id: string;
  payout_id: string;
  payout_status: string;
  return_credit_transaction_id: string | null;
  returned_amount_minor: string | null;
  reversal_ledger_transaction_id: string | null;
  settlement_ledger_transaction_id: string | null;
  user_transaction_id: string;
  webhook_event_id: string | null;
};

type DuplicateLineRow = {
  batch_id: string;
  line_id: string;
};

@Injectable()
export class SqlReconciliationReportStore implements ReconciliationReportStore {
  async deleteExceptionForLine(context: TransactionContext, lineId: string): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        DELETE FROM reconciliation_exceptions
        WHERE report_line_id = $1::uuid
      `,
      [lineId],
    );
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

  async findDuplicateProviderLine(
    context: TransactionContext,
    provider: string,
    providerLineId: string,
    excludingBatchId: string,
  ): Promise<{ batchId: string; lineId: string } | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<DuplicateLineRow>(
      `
        SELECT
          rl.batch_id::text AS batch_id,
          rl.id::text AS line_id
        FROM reconciliation_report_lines rl
        JOIN reconciliation_report_batches rb
          ON rb.id = rl.batch_id
        WHERE rb.provider = $1
          AND rl.provider_line_id = $2
          AND rl.batch_id <> $3::uuid
        ORDER BY rb.received_at DESC, rl.created_at DESC
        LIMIT 1
      `,
      [provider, providerLineId, excludingBatchId],
    );

    if (!result.rows[0]) {
      return null;
    }

    return {
      batchId: result.rows[0].batch_id,
      lineId: result.rows[0].line_id,
    };
  }

  async findFundingMatchCandidate(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<FundingReconciliationMatchCandidate | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<FundingMatchRow>(
      `
        SELECT
          we.id::text AS webhook_event_id,
          we.processing_status AS webhook_processing_status,
          ut.id::text AS user_transaction_id,
          ut.status AS user_transaction_status,
          ut.currency,
          ut.gross_amount_minor,
          ut.fee_amount_minor,
          ut.net_amount_minor,
          lt.id::text AS ledger_transaction_id,
          lt.status AS ledger_transaction_status
        FROM webhook_events we
        LEFT JOIN user_transactions ut
          ON ut.webhook_event_id = we.id
         AND ut.type = 'funding'
        LEFT JOIN ledger_transactions lt
          ON lt.webhook_event_id = we.id
         AND lt.transaction_type = 'funding'
        WHERE we.provider = $1
          AND we.external_event_id = $2
        LIMIT 1
      `,
      [provider, externalEventId],
    );

    return mapFundingCandidate(result.rows[0]);
  }

  async findPayoutMatchCandidate(
    context: TransactionContext,
    input: {
      externalPayoutId: string;
      externalRequestId: string;
      payoutId: string;
      provider: string;
    },
  ): Promise<PayoutReconciliationMatchCandidate | null> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<PayoutMatchRow>(
      `
        SELECT
          p.id::text AS payout_id,
          pa.id::text AS payout_attempt_id,
          p.user_transaction_id::text AS user_transaction_id,
          ut.webhook_event_id::text AS webhook_event_id,
          p.status AS payout_status,
          pa.status AS attempt_status,
          p.currency,
          p.gross_amount_minor,
          p.fee_amount_minor,
          p.net_amount_minor,
          p.returned_amount_minor,
          settlement_lt.id::text AS settlement_ledger_transaction_id,
          reversal_lt.id::text AS reversal_ledger_transaction_id,
          return_credit.id::text AS return_credit_transaction_id
        FROM payout_attempts pa
        JOIN payouts p
          ON p.id = pa.payout_id
        JOIN user_transactions ut
          ON ut.id = p.user_transaction_id
        LEFT JOIN LATERAL (
          SELECT lt.id
          FROM ledger_transactions lt
          WHERE lt.user_transaction_id = p.user_transaction_id
            AND lt.transaction_type = 'payout_settlement'
          ORDER BY lt.created_at DESC
          LIMIT 1
        ) settlement_lt
          ON TRUE
        LEFT JOIN LATERAL (
          SELECT lt.id
          FROM ledger_transactions lt
          LEFT JOIN user_transactions reversal_ut
            ON reversal_ut.id = lt.user_transaction_id
          WHERE lt.transaction_type = 'reversal'
            AND (
              lt.user_transaction_id = p.user_transaction_id
              OR reversal_ut.related_payout_id = p.id
            )
          ORDER BY lt.created_at DESC
          LIMIT 1
        ) reversal_lt
          ON TRUE
        LEFT JOIN LATERAL (
          SELECT reversal_ut.id
          FROM user_transactions reversal_ut
          WHERE reversal_ut.related_payout_id = p.id
            AND reversal_ut.type = 'reversal'
          ORDER BY reversal_ut.created_at DESC
          LIMIT 1
        ) return_credit
          ON TRUE
        WHERE pa.provider = $1
          AND (
            ($2 <> '' AND pa.external_payout_id = $2)
            OR ($3 <> '' AND pa.external_request_id = $3)
            OR ($4 <> '' AND p.id::text = $4)
          )
        ORDER BY
          CASE
            WHEN $2 <> '' AND pa.external_payout_id = $2 THEN 1
            WHEN $3 <> '' AND pa.external_request_id = $3 THEN 2
            WHEN $4 <> '' AND p.id::text = $4 THEN 3
            ELSE 4
          END,
          pa.created_at DESC
        LIMIT 1
      `,
      [input.provider, input.externalPayoutId, input.externalRequestId, input.payoutId],
    );

    return mapPayoutCandidate(result.rows[0]);
  }

  async listBatchLines(
    context: TransactionContext,
    batchId: string,
  ): Promise<StoredReconciliationReportLine[]> {
    const database = getDatabaseQueryable(context);
    const result = await database.query<StoredLineRow>(
      `
        SELECT
          id::text AS id,
          batch_id::text AS batch_id,
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
          internal_reference,
          customer_external_ref,
          wallet_id::text AS wallet_id,
          event_timestamp,
          raw_payload #>> '{payoutId}' AS payout_id
        FROM reconciliation_report_lines
        WHERE batch_id = $1::uuid
        ORDER BY line_index ASC
      `,
      [batchId],
    );

    return result.rows.map(mapStoredLine);
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

  async updateLineClassification(
    context: TransactionContext,
    input: {
      classifiedAt: string;
      lineId: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutAttemptId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      outcome: ReconciliationLineOutcome;
      summary: string;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        UPDATE reconciliation_report_lines
        SET reconciliation_outcome = $2,
            outcome_summary = $3,
            matched_webhook_event_id = $4::uuid,
            matched_user_transaction_id = $5::uuid,
            matched_payout_id = $6::uuid,
            matched_payout_attempt_id = $7::uuid,
            matched_ledger_transaction_id = $8::uuid,
            classified_at = $9::timestamptz,
            updated_at = $10::timestamptz
        WHERE id = $1::uuid
      `,
      [
        input.lineId,
        input.outcome,
        input.summary,
        input.linkedWebhookEventId,
        input.linkedTransactionId,
        input.linkedPayoutId,
        input.linkedPayoutAttemptId,
        input.linkedLedgerTransactionId,
        input.classifiedAt,
        input.updatedAt,
      ],
    );
  }

  async upsertException(
    context: TransactionContext,
    input: {
      batchId: string;
      createdAt: string;
      lineId: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutAttemptId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      outcome: ReconciliationLineOutcome;
      severity: 'high' | 'medium';
      summary: string;
      updatedAt: string;
    },
  ): Promise<void> {
    const database = getDatabaseQueryable(context);

    await database.query(
      `
        INSERT INTO reconciliation_exceptions (
          id,
          report_batch_id,
          report_line_id,
          outcome,
          status,
          severity,
          summary,
          linked_webhook_event_id,
          linked_user_transaction_id,
          linked_payout_id,
          linked_payout_attempt_id,
          linked_ledger_transaction_id,
          created_at,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          'open',
          $5,
          $6,
          $7::uuid,
          $8::uuid,
          $9::uuid,
          $10::uuid,
          $11::uuid,
          $12::timestamptz,
          $13::timestamptz
        )
        ON CONFLICT (report_line_id) DO UPDATE
        SET report_batch_id = EXCLUDED.report_batch_id,
            outcome = EXCLUDED.outcome,
            status = 'open',
            severity = EXCLUDED.severity,
            summary = EXCLUDED.summary,
            linked_webhook_event_id = EXCLUDED.linked_webhook_event_id,
            linked_user_transaction_id = EXCLUDED.linked_user_transaction_id,
            linked_payout_id = EXCLUDED.linked_payout_id,
            linked_payout_attempt_id = EXCLUDED.linked_payout_attempt_id,
            linked_ledger_transaction_id = EXCLUDED.linked_ledger_transaction_id,
            updated_at = EXCLUDED.updated_at,
            resolved_at = NULL
      `,
      [
        randomUUID(),
        input.batchId,
        input.lineId,
        input.outcome,
        input.severity,
        input.summary,
        input.linkedWebhookEventId,
        input.linkedTransactionId,
        input.linkedPayoutId,
        input.linkedPayoutAttemptId,
        input.linkedLedgerTransactionId,
        input.createdAt,
        input.updatedAt,
      ],
    );
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

function mapStoredLine(row: StoredLineRow): StoredReconciliationReportLine {
  return {
    batchId: row.batch_id,
    currency: row.currency,
    customerExternalRef: row.customer_external_ref,
    eventTimestamp: row.event_timestamp,
    externalEventId: row.external_event_id,
    externalPayoutId: row.external_payout_id,
    externalRequestId: row.external_request_id,
    feeAmountMinor: Number(row.fee_amount_minor),
    grossAmountMinor: Number(row.gross_amount_minor),
    id: row.id,
    internalReference: row.internal_reference,
    lineIndex: row.line_index,
    lineStatus: row.line_status,
    lineType: row.line_type,
    netAmountMinor: Number(row.net_amount_minor),
    payoutId: row.payout_id,
    providerLineId: row.provider_line_id,
    returnedAmountMinor:
      row.returned_amount_minor === null ? null : Number(row.returned_amount_minor),
    walletId: row.wallet_id,
  };
}

function mapFundingCandidate(
  row: FundingMatchRow | undefined,
): FundingReconciliationMatchCandidate | null {
  if (!row) {
    return null;
  }

  return {
    currency: row.currency,
    feeAmountMinor: row.fee_amount_minor === null ? null : Number(row.fee_amount_minor),
    grossAmountMinor: row.gross_amount_minor === null ? null : Number(row.gross_amount_minor),
    ledgerTransactionId: row.ledger_transaction_id,
    ledgerTransactionStatus: row.ledger_transaction_status,
    netAmountMinor: row.net_amount_minor === null ? null : Number(row.net_amount_minor),
    userTransactionId: row.user_transaction_id,
    userTransactionStatus: row.user_transaction_status,
    webhookEventId: row.webhook_event_id,
    webhookProcessingStatus: row.webhook_processing_status,
  };
}

function mapPayoutCandidate(
  row: PayoutMatchRow | undefined,
): PayoutReconciliationMatchCandidate | null {
  if (!row) {
    return null;
  }

  return {
    attemptStatus: row.attempt_status,
    currency: row.currency,
    feeAmountMinor: Number(row.fee_amount_minor),
    grossAmountMinor: Number(row.gross_amount_minor),
    netAmountMinor: Number(row.net_amount_minor),
    payoutAttemptId: row.payout_attempt_id,
    payoutId: row.payout_id,
    payoutStatus: row.payout_status,
    returnCreditTransactionId: row.return_credit_transaction_id,
    returnedAmountMinor:
      row.returned_amount_minor === null ? null : Number(row.returned_amount_minor),
    reversalLedgerTransactionId: row.reversal_ledger_transaction_id,
    settlementLedgerTransactionId: row.settlement_ledger_transaction_id,
    userTransactionId: row.user_transaction_id,
    webhookEventId: row.webhook_event_id,
  };
}

import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type AdminOperationsQueryRepository,
  type AdminReconciliationExceptionView,
  type AdminReconciliationReportBatchView,
  type AdminReconciliationReportLineView,
  type AdminWebhookEventView,
} from '../domain/admin-operations-query.repository';

type WebhookRow = {
  event_type: string;
  external_event_id: string;
  id: string;
  linked_payout_id: string | null;
  linked_transaction_id: string | null;
  payload: Record<string, unknown>;
  processing_status: string;
  processed_at: Date | string | null;
  provider: string;
  received_at: Date | string;
};

type ReconciliationRow = {
  kind: AdminReconciliationExceptionView['kind'];
  linked_ledger_transaction_id: string | null;
  linked_payout_id: string | null;
  linked_transaction_id: string | null;
  linked_webhook_event_id: string | null;
  occurred_at: Date | string;
  reference: string | null;
  severity: AdminReconciliationExceptionView['severity'];
  source_id: string;
  summary: string;
};

type ReconciliationBatchRow = {
  exception_count: string;
  id: string;
  line_count: number;
  matched_count: string;
  processed_at: Date | string | null;
  processing_status: string;
  provider: string;
  provider_report_id: string;
  received_at: Date | string;
  report_date: Date | string;
  report_window_end: Date | string;
  report_window_start: Date | string;
};

type ReconciliationLineRow = {
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
  linked_ledger_transaction_id: string | null;
  linked_payout_id: string | null;
  linked_transaction_id: string | null;
  linked_webhook_event_id: string | null;
  internal_match_payload: Record<string, unknown> | null;
  net_amount_minor: string;
  outcome: string | null;
  outcome_summary: string | null;
  provider_line_id: string;
  provider_report_id: string;
  raw_report_payload: Record<string, unknown>;
  returned_amount_minor: string | null;
  severity: AdminReconciliationReportLineView['severity'];
  status: string;
  type: string;
};

@Injectable()
export class SqlAdminOperationsQueryRepository implements AdminOperationsQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listReconciliationExceptions(): Promise<AdminReconciliationExceptionView[]> {
    const result = await this.databaseService.query<ReconciliationRow>(
      `
        WITH report_exceptions AS (
          SELECT
            re.outcome::text AS kind,
            re.linked_ledger_transaction_id::text AS linked_ledger_transaction_id,
            re.linked_payout_id::text AS linked_payout_id,
            re.linked_user_transaction_id::text AS linked_transaction_id,
            re.linked_webhook_event_id::text AS linked_webhook_event_id,
            re.created_at AS occurred_at,
            rl.provider_line_id AS reference,
            re.severity::text AS severity,
            re.id::text AS source_id,
            re.summary
          FROM reconciliation_exceptions re
          LEFT JOIN reconciliation_report_lines rl
            ON rl.id = re.report_line_id
          WHERE re.status = 'open'
        ),
        failed_webhooks AS (
          SELECT
            'webhook_processing'::text AS kind,
            NULL::text AS linked_ledger_transaction_id,
            p.id::text AS linked_payout_id,
            COALESCE(ut_direct.id::text, ut_payout.id::text) AS linked_transaction_id,
            we.id::text AS linked_webhook_event_id,
            we.received_at AS occurred_at,
            we.external_event_id AS reference,
            'medium'::text AS severity,
            we.id::text AS source_id,
            CONCAT('Webhook ', we.event_type, ' ended with ', we.processing_status) AS summary
          FROM webhook_events we
          LEFT JOIN LATERAL (
            SELECT pa.payout_id
            FROM payout_attempts pa
            WHERE pa.provider = we.provider
              AND pa.external_payout_id = we.payload #>> '{data,externalPayoutId}'
            ORDER BY pa.created_at DESC, pa.id DESC
            LIMIT 1
          ) attempt_link
            ON TRUE
          LEFT JOIN payouts p
            ON p.id = attempt_link.payout_id
          LEFT JOIN user_transactions ut_direct
            ON ut_direct.webhook_event_id = we.id
          LEFT JOIN user_transactions ut_payout
            ON ut_payout.id = p.user_transaction_id
          WHERE we.processing_status IN ('failed', 'ignored')
        ),
        failed_payouts AS (
          SELECT
            'payout_failed'::text AS kind,
            NULL::text AS linked_ledger_transaction_id,
            p.id::text AS linked_payout_id,
            p.user_transaction_id::text AS linked_transaction_id,
            ut.webhook_event_id::text AS linked_webhook_event_id,
            COALESCE(p.failed_at, p.updated_at, p.created_at) AS occurred_at,
            p.reference AS reference,
            'medium'::text AS severity,
            p.id::text AS source_id,
            CONCAT('Payout failed for ', r.name) AS summary
          FROM payouts p
          JOIN recipients r
            ON r.id = p.recipient_id
          LEFT JOIN user_transactions ut
            ON ut.id = p.user_transaction_id
          WHERE p.status = 'failed'
        ),
        unbalanced_ledgers AS (
          SELECT
            'ledger_integrity'::text AS kind,
            lt.id::text AS linked_ledger_transaction_id,
            p.id::text AS linked_payout_id,
            lt.user_transaction_id::text AS linked_transaction_id,
            lt.webhook_event_id::text AS linked_webhook_event_id,
            COALESCE(lt.posted_at, lt.created_at) AS occurred_at,
            lt.reference AS reference,
            'high'::text AS severity,
            lt.id::text AS source_id,
            'Ledger transaction is not balanced' AS summary
          FROM ledger_transactions lt
          JOIN (
            SELECT
              le.ledger_transaction_id,
              SUM(CASE WHEN le.direction = 'debit' THEN le.amount_minor ELSE 0 END) AS debit_total,
              SUM(CASE WHEN le.direction = 'credit' THEN le.amount_minor ELSE 0 END) AS credit_total
            FROM ledger_entries le
            GROUP BY le.ledger_transaction_id
          ) totals
            ON totals.ledger_transaction_id = lt.id
          LEFT JOIN payouts p
            ON p.user_transaction_id = lt.user_transaction_id
          WHERE totals.debit_total <> totals.credit_total
        )
        SELECT * FROM report_exceptions
        UNION ALL
        SELECT * FROM failed_webhooks
        UNION ALL
        SELECT * FROM failed_payouts
        UNION ALL
        SELECT * FROM unbalanced_ledgers
        ORDER BY occurred_at DESC, source_id DESC
        LIMIT 100
      `,
    );

    return result.rows.map((row) => ({
      kind: row.kind,
      linkedLedgerTransactionId: row.linked_ledger_transaction_id,
      linkedPayoutId: row.linked_payout_id,
      linkedTransactionId: row.linked_transaction_id,
      linkedWebhookEventId: row.linked_webhook_event_id,
      occurredAt: row.occurred_at,
      reference: row.reference,
      severity: row.severity,
      sourceId: row.source_id,
      summary: row.summary,
    }));
  }

  async listReconciliationReportBatches(): Promise<AdminReconciliationReportBatchView[]> {
    const result = await this.databaseService.query<ReconciliationBatchRow>(
      `
        SELECT
          rb.id::text AS id,
          rb.provider,
          rb.provider_report_id,
          rb.report_date,
          rb.report_window_start,
          rb.report_window_end,
          rb.line_count,
          rb.processing_status,
          rb.received_at,
          rb.processed_at,
          COUNT(DISTINCT rl.id) FILTER (WHERE rl.reconciliation_outcome = 'matched')::text AS matched_count,
          COUNT(DISTINCT re.id) FILTER (WHERE re.status = 'open')::text AS exception_count
        FROM reconciliation_report_batches rb
        LEFT JOIN reconciliation_report_lines rl
          ON rl.batch_id = rb.id
        LEFT JOIN reconciliation_exceptions re
          ON re.report_batch_id = rb.id
        GROUP BY rb.id
        ORDER BY rb.received_at DESC, rb.id DESC
        LIMIT 50
      `,
    );

    return result.rows.map((row) => ({
      exceptionCount: Number(row.exception_count),
      id: row.id,
      lineCount: row.line_count,
      matchedCount: Number(row.matched_count),
      processedAt: row.processed_at,
      processingStatus: row.processing_status,
      provider: row.provider,
      providerReportId: row.provider_report_id,
      receivedAt: row.received_at,
      reportDate: row.report_date,
      reportWindowEnd: row.report_window_end,
      reportWindowStart: row.report_window_start,
    }));
  }

  async listReconciliationReportLines(): Promise<AdminReconciliationReportLineView[]> {
    const result = await this.databaseService.query<ReconciliationLineRow>(
      `
        SELECT
          rl.id::text AS id,
          rl.batch_id::text AS batch_id,
          rb.provider_report_id,
          rl.provider_line_id,
          rl.line_type AS type,
          rl.line_status AS status,
          rl.reconciliation_outcome AS outcome,
          rl.outcome_summary,
          rl.currency,
          rl.gross_amount_minor,
          rl.fee_amount_minor,
          rl.net_amount_minor,
          rl.returned_amount_minor,
          rl.event_timestamp,
          rl.customer_external_ref,
          rl.external_event_id,
          rl.external_payout_id,
          rl.external_request_id,
          rl.matched_webhook_event_id::text AS linked_webhook_event_id,
          rl.matched_user_transaction_id::text AS linked_transaction_id,
          rl.matched_payout_id::text AS linked_payout_id,
          rl.matched_ledger_transaction_id::text AS linked_ledger_transaction_id,
          rl.raw_payload AS raw_report_payload,
          jsonb_strip_nulls(
            jsonb_build_object(
              'webhook',
              CASE
                WHEN we.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', we.id,
                  'provider', we.provider,
                  'externalEventId', we.external_event_id,
                  'eventType', we.event_type,
                  'processingStatus', we.processing_status,
                  'receivedAt', we.received_at,
                  'processedAt', we.processed_at,
                  'payload', we.payload
                )
              END,
              'transaction',
              CASE
                WHEN ut.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', ut.id,
                  'type', ut.type,
                  'direction', ut.direction,
                  'status', ut.status,
                  'currency', ut.currency,
                  'grossAmountMinor', ut.gross_amount_minor,
                  'feeAmountMinor', ut.fee_amount_minor,
                  'netAmountMinor', ut.net_amount_minor,
                  'reference', ut.reference,
                  'description', ut.description,
                  'occurredAt', ut.occurred_at,
                  'postedAt', ut.posted_at
                )
              END,
              'payout',
              CASE
                WHEN p.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', p.id,
                  'status', p.status,
                  'currency', p.currency,
                  'grossAmountMinor', p.gross_amount_minor,
                  'feeAmountMinor', p.fee_amount_minor,
                  'netAmountMinor', p.net_amount_minor,
                  'returnedAmountMinor', p.returned_amount_minor,
                  'reference', p.reference,
                  'submittedAt', p.submitted_at,
                  'completedAt', p.completed_at,
                  'failedAt', p.failed_at,
                  'returnedAt', p.returned_at
                )
              END,
              'attempt',
              CASE
                WHEN pa.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', pa.id,
                  'provider', pa.provider,
                  'status', pa.status,
                  'externalRequestId', pa.external_request_id,
                  'externalPayoutId', pa.external_payout_id,
                  'submittedAt', pa.submitted_at,
                  'resolvedAt', pa.resolved_at,
                  'requestPayload', pa.request_payload,
                  'responsePayload', pa.response_payload
                )
              END,
              'ledger',
              CASE
                WHEN lt.id IS NULL THEN NULL
                ELSE jsonb_build_object(
                  'id', lt.id,
                  'transactionType', lt.transaction_type,
                  'status', lt.status,
                  'currency', lt.currency,
                  'reference', lt.reference,
                  'description', lt.description,
                  'postedAt', lt.posted_at,
                  'entries', COALESCE(le.entries, '[]'::jsonb)
                )
              END
            )
          ) AS internal_match_payload,
          re.severity
        FROM reconciliation_report_lines rl
        JOIN reconciliation_report_batches rb
          ON rb.id = rl.batch_id
        LEFT JOIN webhook_events we
          ON we.id = rl.matched_webhook_event_id
        LEFT JOIN user_transactions ut
          ON ut.id = rl.matched_user_transaction_id
        LEFT JOIN payouts p
          ON p.id = rl.matched_payout_id
        LEFT JOIN payout_attempts pa
          ON pa.id = rl.matched_payout_attempt_id
        LEFT JOIN ledger_transactions lt
          ON lt.id = rl.matched_ledger_transaction_id
        LEFT JOIN LATERAL (
          SELECT
            jsonb_agg(
              jsonb_build_object(
                'accountCode', la.code,
                'accountName', la.name,
                'direction', le.direction,
                'amountMinor', le.amount_minor,
                'currency', le.currency
              )
              ORDER BY le.id
            ) AS entries
          FROM ledger_entries le
          JOIN ledger_accounts la
            ON la.id = le.ledger_account_id
          WHERE le.ledger_transaction_id = lt.id
        ) le
          ON TRUE
        LEFT JOIN reconciliation_exceptions re
          ON re.report_line_id = rl.id
         AND re.status = 'open'
        ORDER BY rl.event_timestamp DESC, rl.id DESC
        LIMIT 100
      `,
    );

    return result.rows.map((row) => ({
      batchId: row.batch_id,
      currency: row.currency,
      customerExternalRef: row.customer_external_ref,
      eventTimestamp: row.event_timestamp,
      externalEventId: row.external_event_id,
      externalPayoutId: row.external_payout_id,
      externalRequestId: row.external_request_id,
      feeAmountMinor: row.fee_amount_minor,
      grossAmountMinor: row.gross_amount_minor,
      id: row.id,
      internalMatchPayload: row.internal_match_payload,
      linkedLedgerTransactionId: row.linked_ledger_transaction_id,
      linkedPayoutId: row.linked_payout_id,
      linkedTransactionId: row.linked_transaction_id,
      linkedWebhookEventId: row.linked_webhook_event_id,
      netAmountMinor: row.net_amount_minor,
      outcome: row.outcome,
      outcomeSummary: row.outcome_summary,
      providerLineId: row.provider_line_id,
      providerReportId: row.provider_report_id,
      rawReportPayload: row.raw_report_payload,
      returnedAmountMinor: row.returned_amount_minor,
      severity: row.severity,
      status: row.status,
      type: row.type,
    }));
  }

  async listWebhookEvents(): Promise<AdminWebhookEventView[]> {
    const result = await this.databaseService.query<WebhookRow>(
      `
        SELECT
          we.id::text AS id,
          we.provider,
          we.external_event_id,
          we.event_type,
          we.processing_status,
          we.payload,
          we.received_at,
          we.processed_at,
          p.id::text AS linked_payout_id,
          COALESCE(ut_direct.id::text, ut_payout.id::text) AS linked_transaction_id
        FROM webhook_events we
        LEFT JOIN LATERAL (
          SELECT pa.payout_id
          FROM payout_attempts pa
          WHERE pa.provider = we.provider
            AND pa.external_payout_id = we.payload #>> '{data,externalPayoutId}'
          ORDER BY pa.created_at DESC, pa.id DESC
          LIMIT 1
        ) attempt_link
          ON TRUE
        LEFT JOIN payouts p
          ON p.id = attempt_link.payout_id
        LEFT JOIN user_transactions ut_direct
          ON ut_direct.webhook_event_id = we.id
        LEFT JOIN user_transactions ut_payout
          ON ut_payout.id = p.user_transaction_id
        ORDER BY we.received_at DESC, we.id DESC
        LIMIT 100
      `,
    );

    return result.rows.map((row) => ({
      eventType: row.event_type,
      externalEventId: row.external_event_id,
      id: row.id,
      linkedPayoutId: row.linked_payout_id,
      linkedTransactionId: row.linked_transaction_id,
      payload: row.payload,
      processingStatus: row.processing_status,
      processedAt: row.processed_at,
      provider: row.provider,
      receivedAt: row.received_at,
    }));
  }
}

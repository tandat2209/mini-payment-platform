import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type AdminOperationsQueryRepository,
  type AdminReconciliationExceptionView,
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

@Injectable()
export class SqlAdminOperationsQueryRepository implements AdminOperationsQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

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

  async listReconciliationExceptions(): Promise<AdminReconciliationExceptionView[]> {
    const result = await this.databaseService.query<ReconciliationRow>(
      `
        WITH failed_webhooks AS (
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
}

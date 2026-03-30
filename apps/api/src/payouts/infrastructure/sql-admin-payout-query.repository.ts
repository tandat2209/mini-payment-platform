import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type AdminPayoutListItemView,
  type AdminPayoutQueryRepository,
} from '../domain/admin-payout-query.repository';

type AdminPayoutRow = {
  attempt_status: string | null;
  completed_at: Date | string | null;
  created_at: Date | string;
  currency: string;
  customer_external_ref: string;
  customer_id: string;
  external_payout_id: string | null;
  external_request_id: string | null;
  failed_at: Date | string | null;
  fee_amount_minor: string;
  gross_amount_minor: string;
  id: string;
  latest_webhook_event_id: string | null;
  provider: string | null;
  recipient_id: string;
  recipient_name: string;
  reference: string | null;
  returned_amount_minor: string | null;
  returned_at: Date | string | null;
  status: string;
  submitted_at: Date | string | null;
  user_transaction_id: string;
  wallet_id: string;
  wallet_restored_amount_minor: string | null;
};

@Injectable()
export class SqlAdminPayoutQueryRepository implements AdminPayoutQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listPayouts(): Promise<AdminPayoutListItemView[]> {
    const result = await this.databaseService.query<AdminPayoutRow>(
      `
        SELECT
          p.id,
          p.reference,
          p.status,
          p.currency,
          p.gross_amount_minor::text AS gross_amount_minor,
          p.fee_amount_minor::text AS fee_amount_minor,
          p.created_at,
          p.submitted_at,
          p.completed_at,
          p.failed_at,
          p.returned_at,
          p.returned_amount_minor::text AS returned_amount_minor,
          CASE
            WHEN p.returned_amount_minor IS NOT NULL
              THEN (p.returned_amount_minor + p.fee_amount_minor)::text
            ELSE NULL
          END AS wallet_restored_amount_minor,
          p.user_transaction_id::text AS user_transaction_id,
          p.wallet_id::text AS wallet_id,
          u.id::text AS customer_id,
          u.external_ref AS customer_external_ref,
          r.id::text AS recipient_id,
          r.name AS recipient_name,
          latest_attempt.provider,
          latest_attempt.status AS attempt_status,
          latest_attempt.external_request_id,
          latest_attempt.external_payout_id,
          ut.webhook_event_id::text AS latest_webhook_event_id
        FROM payouts p
        JOIN users u
          ON u.id = p.user_id
        JOIN recipients r
          ON r.id = p.recipient_id
        LEFT JOIN user_transactions ut
          ON ut.id = p.user_transaction_id
        LEFT JOIN LATERAL (
          SELECT
            pa.provider,
            pa.status,
            pa.external_request_id,
            pa.external_payout_id
          FROM payout_attempts pa
          WHERE pa.payout_id = p.id
          ORDER BY pa.submitted_at DESC, pa.created_at DESC, pa.id DESC
          LIMIT 1
        ) latest_attempt
          ON TRUE
        ORDER BY p.created_at DESC, p.id DESC
      `,
    );

    return result.rows.map((row) => ({
      attemptStatus: row.attempt_status,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      currency: row.currency,
      customerExternalRef: row.customer_external_ref,
      customerId: row.customer_id,
      externalPayoutId: row.external_payout_id,
      externalRequestId: row.external_request_id,
      failedAt: row.failed_at,
      feeAmountMinor: row.fee_amount_minor,
      grossAmountMinor: row.gross_amount_minor,
      id: row.id,
      latestWebhookEventId: row.latest_webhook_event_id,
      provider: row.provider,
      recipientId: row.recipient_id,
      recipientName: row.recipient_name,
      reference: row.reference,
      returnedAmountMinor: row.returned_amount_minor,
      returnedAt: row.returned_at,
      status: row.status,
      submittedAt: row.submitted_at,
      userTransactionId: row.user_transaction_id,
      walletId: row.wallet_id,
      walletRestoredAmountMinor: row.wallet_restored_amount_minor,
    }));
  }
}

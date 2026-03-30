import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  type ReconciliationReportLine,
  type ReconciliationReportSimulationRequest,
  type ReconciliationReportSimulationResponse,
} from './reconciliation.types';

type FundingReportRow = {
  currency: string;
  customer_external_ref: string;
  external_event_id: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  internal_reference: string | null;
  net_amount_minor: string;
  occurred_at: string;
  provider_reference: string | null;
  transaction_id: string;
  wallet_id: string;
};

type PayoutReportRow = {
  currency: string;
  customer_external_ref: string;
  event_timestamp: string;
  external_payout_id: string;
  external_request_id: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  internal_reference: string | null;
  net_amount_minor: string;
  payout_id: string;
  recipient_name: string | null;
  status: 'failed' | 'paid' | 'processing' | 'submitted';
  wallet_id: string;
};

type ReturnReportRow = {
  currency: string;
  customer_external_ref: string;
  external_payout_id: string;
  external_request_id: string;
  fee_amount_minor: string;
  gross_amount_minor: string;
  internal_reference: string | null;
  net_amount_minor: string;
  payout_id: string;
  returned_amount_minor: string;
  returned_at: string;
  wallet_id: string;
};

@Injectable()
export class ReconciliationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async simulateDailyReport(
    request: ReconciliationReportSimulationRequest,
  ): Promise<ReconciliationReportSimulationResponse> {
    const reportWindowStart = new Date(`${request.reportDate}T00:00:00.000Z`);
    const reportWindowEnd = new Date(`${request.reportDate}T00:00:00.000Z`);
    reportWindowEnd.setUTCDate(reportWindowEnd.getUTCDate() + 1);

    const [fundingLines, payoutLines, returnLines] = await Promise.all([
      this.listFundingLines(reportWindowStart.toISOString(), reportWindowEnd.toISOString()),
      this.listPayoutLines(reportWindowStart.toISOString(), reportWindowEnd.toISOString()),
      this.listReturnLines(reportWindowStart.toISOString(), reportWindowEnd.toISOString()),
    ]);
    const lines = [...fundingLines, ...payoutLines, ...returnLines].sort((left, right) =>
      left.eventTimestamp.localeCompare(right.eventTimestamp),
    );
    const externalEventId =
      request.externalEventId ??
      `evt_reconciliation_${request.reportDate.replace(/-/g, '')}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    const providerReportId =
      request.providerReportId ?? `rpt_${request.reportDate.replace(/-/g, '')}_psp_sandbox`;
    const occurredAt = new Date().toISOString();
    const deliveryTarget = `${this.getTargetApiBaseUrl()}/webhooks/reconciliation-reports`;
    const payload: ReconciliationReportSimulationResponse['payload'] = {
      data: {
        lineCount: lines.length,
        lines,
        providerReportId,
        reportDate: request.reportDate,
        reportWindowEnd: reportWindowEnd.toISOString(),
        reportWindowStart: reportWindowStart.toISOString(),
      },
      eventType: 'reconciliation.report.generated',
      externalEventId,
      occurredAt,
      provider: 'psp_sandbox',
    };
    const response = await fetch(deliveryTarget, {
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
    const receiverResponse = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        typeof receiverResponse.error === 'object' &&
          receiverResponse.error !== null &&
          'message' in receiverResponse.error
          ? String(receiverResponse.error.message)
          : `PSP sandbox delivery failed with status ${response.status}`,
      );
    }

    return {
      delivered: true,
      deliveryTarget,
      externalEventId,
      payload,
      receiverResponse,
    };
  }

  private async listFundingLines(
    reportWindowStart: string,
    reportWindowEnd: string,
  ): Promise<ReconciliationReportLine[]> {
    const result = await this.databaseService.query<FundingReportRow>(
      `
        SELECT
          ut.id::text AS transaction_id,
          ut.wallet_id::text AS wallet_id,
          u.external_ref AS customer_external_ref,
          ut.currency,
          ut.gross_amount_minor::text AS gross_amount_minor,
          ut.fee_amount_minor::text AS fee_amount_minor,
          ut.net_amount_minor::text AS net_amount_minor,
          COALESCE(ut.reference, we.payload->'data'->>'providerReference') AS internal_reference,
          we.external_event_id,
          we.payload->'data'->>'providerReference' AS provider_reference,
          COALESCE(ut.posted_at, ut.occurred_at)::text AS occurred_at
        FROM user_transactions ut
        INNER JOIN webhook_events we
          ON we.id = ut.webhook_event_id
        INNER JOIN users u
          ON u.id = ut.user_id
        WHERE ut.type = 'funding'
          AND we.provider = 'psp_sandbox'
          AND we.event_type = 'funding.completed'
          AND COALESCE(ut.posted_at, ut.occurred_at) >= $1::timestamptz
          AND COALESCE(ut.posted_at, ut.occurred_at) < $2::timestamptz
        ORDER BY COALESCE(ut.posted_at, ut.occurred_at), ut.id
      `,
      [reportWindowStart, reportWindowEnd],
    );

    return result.rows.map((row) => ({
      currency: row.currency,
      customerExternalRef: row.customer_external_ref,
      eventTimestamp: row.occurred_at,
      externalEventId: row.external_event_id,
      feeAmountMinor: Number(row.fee_amount_minor),
      grossAmountMinor: Number(row.gross_amount_minor),
      internalReference: row.internal_reference,
      lineId: `funding:${row.transaction_id}`,
      lineType: 'funding',
      netAmountMinor: Number(row.net_amount_minor),
      providerReference: row.provider_reference,
      status: 'completed',
      walletId: row.wallet_id,
    }));
  }

  private async listPayoutLines(
    reportWindowStart: string,
    reportWindowEnd: string,
  ): Promise<ReconciliationReportLine[]> {
    const result = await this.databaseService.query<PayoutReportRow>(
      `
        SELECT
          p.id::text AS payout_id,
          p.wallet_id::text AS wallet_id,
          u.external_ref AS customer_external_ref,
          p.currency,
          p.gross_amount_minor::text AS gross_amount_minor,
          p.fee_amount_minor::text AS fee_amount_minor,
          p.net_amount_minor::text AS net_amount_minor,
          p.reference AS internal_reference,
          r.name AS recipient_name,
          pa.external_payout_id,
          pa.external_request_id,
          p.status,
          CASE
            WHEN p.status = 'paid' THEN COALESCE(p.completed_at, p.submitted_at, p.created_at)
            WHEN p.status = 'failed' THEN COALESCE(p.failed_at, p.submitted_at, p.created_at)
            ELSE COALESCE(p.submitted_at, p.created_at)
          END::text AS event_timestamp
        FROM payouts p
        INNER JOIN users u
          ON u.id = p.user_id
        LEFT JOIN recipients r
          ON r.id = p.recipient_id
        LEFT JOIN LATERAL (
          SELECT
            pa.external_payout_id,
            pa.external_request_id
          FROM payout_attempts pa
          WHERE pa.payout_id = p.id
          ORDER BY pa.submitted_at DESC, pa.created_at DESC, pa.id DESC
          LIMIT 1
        ) pa ON TRUE
        WHERE p.status IN ('submitted', 'processing', 'paid', 'failed')
          AND COALESCE(
            CASE
              WHEN p.status = 'paid' THEN COALESCE(p.completed_at, p.submitted_at, p.created_at)
              WHEN p.status = 'failed' THEN COALESCE(p.failed_at, p.submitted_at, p.created_at)
              ELSE COALESCE(p.submitted_at, p.created_at)
            END,
            p.created_at
          ) >= $1::timestamptz
          AND COALESCE(
            CASE
              WHEN p.status = 'paid' THEN COALESCE(p.completed_at, p.submitted_at, p.created_at)
              WHEN p.status = 'failed' THEN COALESCE(p.failed_at, p.submitted_at, p.created_at)
              ELSE COALESCE(p.submitted_at, p.created_at)
            END,
            p.created_at
          ) < $2::timestamptz
        ORDER BY event_timestamp, p.id
      `,
      [reportWindowStart, reportWindowEnd],
    );

    return result.rows
      .filter((row) => row.external_payout_id && row.external_request_id)
      .map((row) => ({
        currency: row.currency,
        customerExternalRef: row.customer_external_ref,
        eventTimestamp: row.event_timestamp,
        externalPayoutId: row.external_payout_id,
        externalRequestId: row.external_request_id,
        feeAmountMinor: Number(row.fee_amount_minor),
        grossAmountMinor: Number(row.gross_amount_minor),
        internalReference: row.internal_reference,
        lineId: `payout:${row.payout_id}`,
        lineType: 'payout',
        netAmountMinor: Number(row.net_amount_minor),
        payoutId: row.payout_id,
        recipientName: row.recipient_name,
        status: row.status,
        walletId: row.wallet_id,
      }));
  }

  private async listReturnLines(
    reportWindowStart: string,
    reportWindowEnd: string,
  ): Promise<ReconciliationReportLine[]> {
    const result = await this.databaseService.query<ReturnReportRow>(
      `
        SELECT
          p.id::text AS payout_id,
          p.wallet_id::text AS wallet_id,
          u.external_ref AS customer_external_ref,
          p.currency,
          p.gross_amount_minor::text AS gross_amount_minor,
          p.fee_amount_minor::text AS fee_amount_minor,
          p.net_amount_minor::text AS net_amount_minor,
          p.reference AS internal_reference,
          p.returned_amount_minor::text AS returned_amount_minor,
          p.returned_at::text AS returned_at,
          pa.external_payout_id,
          pa.external_request_id
        FROM payouts p
        INNER JOIN users u
          ON u.id = p.user_id
        LEFT JOIN LATERAL (
          SELECT
            pa.external_payout_id,
            pa.external_request_id
          FROM payout_attempts pa
          WHERE pa.payout_id = p.id
          ORDER BY pa.submitted_at DESC, pa.created_at DESC, pa.id DESC
          LIMIT 1
        ) pa ON TRUE
        WHERE p.status = 'returned'
          AND p.returned_at IS NOT NULL
          AND p.returned_amount_minor IS NOT NULL
          AND p.returned_at >= $1::timestamptz
          AND p.returned_at < $2::timestamptz
        ORDER BY p.returned_at, p.id
      `,
      [reportWindowStart, reportWindowEnd],
    );

    return result.rows
      .filter((row) => row.external_payout_id && row.external_request_id)
      .map((row) => ({
        currency: row.currency,
        customerExternalRef: row.customer_external_ref,
        eventTimestamp: row.returned_at,
        externalPayoutId: row.external_payout_id,
        externalRequestId: row.external_request_id,
        feeAmountMinor: Number(row.fee_amount_minor),
        grossAmountMinor: Number(row.gross_amount_minor),
        internalReference: row.internal_reference,
        lineId: `return:${row.payout_id}`,
        lineType: 'return',
        netAmountMinor: Number(row.net_amount_minor),
        payoutId: row.payout_id,
        returnedAmountMinor: Number(row.returned_amount_minor),
        status: 'returned',
        walletId: row.wallet_id,
      }));
  }

  private getTargetApiBaseUrl(): string {
    return (process.env.PSP_SANDBOX_TARGET_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(
      /\/$/,
      '',
    );
  }
}

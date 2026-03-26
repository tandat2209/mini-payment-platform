import { Injectable } from '@nestjs/common';

import { type DatabaseQueryable } from '../database/database.service';
import { type PayoutActivityRepository } from './payout-activity.repository';
import { type SandboxPayoutRecord } from './payouts.types';

type SandboxPayoutRow = {
  callback_mode: 'manual';
  current_status: string;
  external_payout_id: string;
  external_request_id: string;
  payout_reference: string;
  simulated_final_status: 'failed' | 'paid';
};

@Injectable()
export class SqlPayoutActivityRepository implements PayoutActivityRepository {
  async createSubmittedPayout(
    database: DatabaseQueryable,
    input: {
      acceptedAt: string;
      amountMinor: number;
      beneficiaryId?: string;
      callbackMode: 'manual';
      currency: string;
      destinationDetails: Record<string, unknown> | null;
      externalPayoutId: string;
      externalRequestId: string;
      payoutReference: string;
      provider: 'psp_sandbox';
      rail: 'ach' | 'sepa' | 'swift';
      recipientCountryCode: string;
      recipientName: string;
      sandboxPayoutId: string;
      simulatedFinalStatus: 'failed' | 'paid';
      submissionMode: 'inline_details' | 'provider_beneficiary';
    },
  ): Promise<void> {
    await database.query(
      `
        INSERT INTO psp_sandbox_payouts (
          id,
          provider,
          external_request_id,
          external_payout_id,
          payout_reference,
          amount_minor,
          currency,
          recipient_name,
          recipient_country_code,
          rail,
          submission_mode,
          beneficiary_id,
          destination_details,
          current_status,
          simulated_final_status,
          callback_mode,
          accepted_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
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
          'accepted',
          $14,
          $15,
          $16,
          $16
        )
      `,
      [
        input.sandboxPayoutId,
        input.provider,
        input.externalRequestId,
        input.externalPayoutId,
        input.payoutReference,
        input.amountMinor,
        input.currency,
        input.recipientName,
        input.recipientCountryCode,
        input.rail,
        input.submissionMode,
        input.beneficiaryId ?? null,
        input.destinationDetails === null ? null : JSON.stringify(input.destinationDetails),
        input.simulatedFinalStatus,
        input.callbackMode,
        input.acceptedAt,
      ],
    );
  }

  async findSubmittedPayoutByExternalPayoutId(
    database: DatabaseQueryable,
    externalPayoutId: string,
  ): Promise<SandboxPayoutRecord | null> {
    const result = await database.query<SandboxPayoutRow>(
      `
        SELECT
          callback_mode,
          current_status,
          external_payout_id,
          external_request_id,
          payout_reference,
          simulated_final_status
        FROM psp_sandbox_payouts
        WHERE external_payout_id = $1
      `,
      [externalPayoutId],
    );
    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      callbackMode: row.callback_mode,
      externalPayoutId: row.external_payout_id,
      externalRequestId: row.external_request_id,
      payoutReference: row.payout_reference,
      simulatedFinalStatus: row.simulated_final_status,
    };
  }

  async recordPayoutEvent(
    database: DatabaseQueryable,
    input: {
      aggregateExternalId: string;
      deliveredAt?: string;
      eventId: string;
      eventType: 'payout.submitted' | 'payout.updated';
      externalEventId: string;
      occurredAt: string;
      payload: Record<string, unknown>;
    },
  ): Promise<void> {
    await database.query(
      `
        INSERT INTO psp_sandbox_events (
          id,
          provider,
          aggregate_type,
          aggregate_external_id,
          event_type,
          external_event_id,
          payload,
          occurred_at,
          delivered_at
        )
        VALUES (
          $1,
          'psp_sandbox',
          'payout',
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        ON CONFLICT (external_event_id) DO NOTHING
      `,
      [
        input.eventId,
        input.aggregateExternalId,
        input.eventType,
        input.externalEventId,
        JSON.stringify(input.payload),
        input.occurredAt,
        input.deliveredAt ?? null,
      ],
    );
  }

  async updatePayoutStatus(
    database: DatabaseQueryable,
    input: {
      externalPayoutId: string;
      nextStatus: 'failed' | 'paid' | 'processing';
      updatedAt: string;
    },
  ): Promise<void> {
    const currentStatus = input.nextStatus === 'paid' ? 'succeeded' : input.nextStatus;

    await database.query(
      `
        UPDATE psp_sandbox_payouts
        SET current_status = $2,
            updated_at = $3
        WHERE external_payout_id = $1
      `,
      [input.externalPayoutId, currentStatus, input.updatedAt],
    );
  }
}

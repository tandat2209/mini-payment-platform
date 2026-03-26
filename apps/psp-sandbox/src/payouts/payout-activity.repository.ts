import { type DatabaseQueryable } from '../database/database.service';
import { type SandboxPayoutRecord } from './payouts.types';

export const PAYOUT_ACTIVITY_REPOSITORY = Symbol('PAYOUT_ACTIVITY_REPOSITORY');

export interface PayoutActivityRepository {
  createSubmittedPayout(
    database: DatabaseQueryable,
    input: {
      acceptedAt: string;
      amountMinor: number;
      callbackMode: 'manual';
      currency: string;
      destinationDetails: Record<string, unknown> | null;
      externalPayoutId: string;
      externalRequestId: string;
      payoutReference: string;
      provider: 'psp_sandbox';
      recipientCountryCode: string;
      recipientName: string;
      rail: 'ach' | 'sepa' | 'swift';
      sandboxPayoutId: string;
      simulatedFinalStatus: 'failed' | 'paid';
      submissionMode: 'inline_details' | 'provider_beneficiary';
      beneficiaryId?: string;
    },
  ): Promise<void>;
  findSubmittedPayoutByExternalPayoutId(
    database: DatabaseQueryable,
    externalPayoutId: string,
  ): Promise<SandboxPayoutRecord | null>;
  recordPayoutEvent(
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
  ): Promise<void>;
  updatePayoutStatus(
    database: DatabaseQueryable,
    input: {
      externalPayoutId: string;
      nextStatus: 'failed' | 'paid' | 'processing';
      updatedAt: string;
    },
  ): Promise<void>;
}

import { randomUUID } from 'node:crypto';

import { Injectable, UnprocessableEntityException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  type PayoutReturnSimulationRequest,
  type PayoutReturnSimulationResponse,
  type PayoutSubmissionRequest,
  type PayoutSubmissionResponse,
  type PayoutUpdateSimulationRequest,
  type PayoutUpdateSimulationResponse,
} from './payouts.types';

type SubmittedPayoutLookupRow = {
  currency: string;
  external_payout_id: string;
  external_request_id: string;
  gross_amount_minor: number;
  payout_status: string;
  payout_reference: string;
};

@Injectable()
export class PayoutsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async submitPayout(request: PayoutSubmissionRequest): Promise<PayoutSubmissionResponse> {
    validatePayoutSubmissionRequest(request);

    const acceptedAt = new Date().toISOString();
    const externalRequestId = `preq_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const externalPayoutId = `ppay_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const callbackMode = request.simulation?.callbackMode ?? 'manual';
    const simulatedFinalStatus = request.simulation?.finalStatus ?? 'paid';

    return {
      acceptedAt,
      callbackMode,
      externalPayoutId,
      externalRequestId,
      provider: 'psp_sandbox',
      simulatedFinalStatus,
      status: 'accepted',
    };
  }

  async simulatePayoutUpdate(
    request: PayoutUpdateSimulationRequest,
  ): Promise<PayoutUpdateSimulationResponse> {
    validatePayoutUpdateRequest(request);

    const submittedPayout = await this.findSubmittedPayoutByExternalPayoutId(
      request.externalPayoutId,
    );

    if (!submittedPayout) {
      throw new UnprocessableEntityException({
        error: 'UNKNOWN_PAYOUT',
        message: `Unknown PSP sandbox payout ${request.externalPayoutId}`,
      });
    }

    const externalEventId =
      request.externalEventId ?? `evt_payout_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const occurredAt = new Date().toISOString();
    const deliveryTarget = `${this.getTargetApiBaseUrl()}/webhooks/payouts`;
    const data: PayoutUpdateSimulationResponse['payload']['data'] = {
      externalPayoutId: submittedPayout.external_payout_id,
      externalRequestId: submittedPayout.external_request_id,
      payoutReference: submittedPayout.payout_reference,
      status: request.status,
    };

    if (request.failureReason !== undefined) {
      data.failureReason = request.failureReason;
    }

    const payload: PayoutUpdateSimulationResponse['payload'] = {
      data,
      eventType: 'payout.updated',
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

  async simulatePayoutReturn(
    request: PayoutReturnSimulationRequest,
  ): Promise<PayoutReturnSimulationResponse> {
    validatePayoutReturnRequest(request);

    const submittedPayout = await this.findSubmittedPayoutByExternalPayoutId(
      request.externalPayoutId,
    );

    if (!submittedPayout) {
      throw new UnprocessableEntityException({
        error: 'UNKNOWN_PAYOUT',
        message: `Unknown PSP sandbox payout ${request.externalPayoutId}`,
      });
    }

    if (submittedPayout.payout_status !== 'paid') {
      throw new UnprocessableEntityException({
        error: 'PAYOUT_RETURN_VALIDATION_FAILED',
        message: `Payout ${request.externalPayoutId} must be paid before it can be returned`,
      });
    }

    if (request.returnedAmountMinor > submittedPayout.gross_amount_minor) {
      throw new UnprocessableEntityException({
        error: 'PAYOUT_RETURN_VALIDATION_FAILED',
        message: 'Returned amount cannot exceed the original payout gross amount',
      });
    }

    const externalEventId =
      request.externalEventId ?? `evt_payout_return_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const occurredAt = new Date().toISOString();
    const deliveryTarget = `${this.getTargetApiBaseUrl()}/webhooks/payouts`;
    const data: PayoutReturnSimulationResponse['payload']['data'] = {
      currency: submittedPayout.currency,
      externalPayoutId: submittedPayout.external_payout_id,
      externalRequestId: submittedPayout.external_request_id,
      payoutReference: submittedPayout.payout_reference,
      returnedAmountMinor: request.returnedAmountMinor,
      status: 'returned',
    };

    if (request.returnReason !== undefined) {
      data.returnReason = request.returnReason;
    }

    const payload: PayoutReturnSimulationResponse['payload'] = {
      data,
      eventType: 'payout.returned',
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

  private getTargetApiBaseUrl(): string {
    return (process.env.PSP_SANDBOX_TARGET_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(
      /\/$/,
      '',
    );
  }

  private async findSubmittedPayoutByExternalPayoutId(
    externalPayoutId: string,
  ): Promise<SubmittedPayoutLookupRow | null> {
    const result = await this.databaseService.query<SubmittedPayoutLookupRow>(
      `
        SELECT
          p.currency,
          pa.external_payout_id,
          pa.external_request_id,
          p.gross_amount_minor,
          p.status AS payout_status,
          p.reference AS payout_reference
        FROM payout_attempts pa
        INNER JOIN payouts p
          ON p.id = pa.payout_id
        WHERE pa.external_payout_id = $1
        ORDER BY pa.created_at DESC
        LIMIT 1
      `,
      [externalPayoutId],
    );

    return result.rows[0] ?? null;
  }
}

function validatePayoutSubmissionRequest(request: PayoutSubmissionRequest): void {
  if (request.amountMinor <= 0) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_VALIDATION_FAILED',
      message: 'Payout amount must be greater than zero',
    });
  }

  if (!/^[A-Z]{3}$/u.test(request.currency)) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_VALIDATION_FAILED',
      message: 'Payout currency must be a 3-letter uppercase code',
    });
  }

  if (!request.payoutReference.trim()) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_VALIDATION_FAILED',
      message: 'Payout reference is required',
    });
  }

  if (request.submissionTarget.mode === 'provider_beneficiary') {
    if (!request.submissionTarget.beneficiaryId.trim()) {
      throw new UnprocessableEntityException({
        error: 'PAYOUT_VALIDATION_FAILED',
        message: 'Beneficiary reference is required for provider beneficiary submissions',
      });
    }

    return;
  }

  if (Object.keys(request.submissionTarget.details).length === 0) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_VALIDATION_FAILED',
      message: 'Inline payout submissions require destination details',
    });
  }
}

function validatePayoutUpdateRequest(request: PayoutUpdateSimulationRequest): void {
  if (request.status === 'failed') {
    return;
  }

  if (request.failureReason !== undefined) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_UPDATE_VALIDATION_FAILED',
      message: 'Failure reason can only be provided for failed payout updates',
    });
  }
}

function validatePayoutReturnRequest(request: PayoutReturnSimulationRequest): void {
  if (request.returnedAmountMinor <= 0) {
    throw new UnprocessableEntityException({
      error: 'PAYOUT_RETURN_VALIDATION_FAILED',
      message: 'Returned amount must be greater than zero',
    });
  }
}

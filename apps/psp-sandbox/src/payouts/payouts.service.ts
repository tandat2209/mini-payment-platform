import { randomUUID } from 'node:crypto';

import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  PAYOUT_ACTIVITY_REPOSITORY,
  type PayoutActivityRepository,
} from './payout-activity.repository';
import {
  type PayoutSubmissionRequest,
  type PayoutSubmissionResponse,
  type PayoutUpdateSimulationRequest,
  type PayoutUpdateSimulationResponse,
} from './payouts.types';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(PAYOUT_ACTIVITY_REPOSITORY)
    private readonly payoutActivityRepository: PayoutActivityRepository,
  ) {}

  async submitPayout(request: PayoutSubmissionRequest): Promise<PayoutSubmissionResponse> {
    validatePayoutSubmissionRequest(request);

    const acceptedAt = new Date().toISOString();
    const externalRequestId = `preq_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const externalPayoutId = `ppay_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const callbackMode = request.simulation?.callbackMode ?? 'manual';
    const simulatedFinalStatus = request.simulation?.finalStatus ?? 'paid';
    const sandboxPayoutId = randomUUID();

    await this.databaseService.transaction(async (database) => {
      await this.payoutActivityRepository.createSubmittedPayout(database, {
        acceptedAt,
        amountMinor: request.amountMinor,
        callbackMode,
        currency: request.currency,
        destinationDetails:
          request.submissionTarget.mode === 'inline_details'
            ? request.submissionTarget.details
            : null,
        externalPayoutId,
        externalRequestId,
        payoutReference: request.payoutReference,
        provider: 'psp_sandbox',
        rail: request.recipient.rail,
        recipientCountryCode: request.recipient.countryCode,
        recipientName: request.recipient.name,
        sandboxPayoutId,
        simulatedFinalStatus,
        submissionMode: request.submissionTarget.mode,
        ...(request.submissionTarget.mode === 'provider_beneficiary'
          ? { beneficiaryId: request.submissionTarget.beneficiaryId }
          : {}),
      });

      await this.payoutActivityRepository.recordPayoutEvent(database, {
        aggregateExternalId: externalPayoutId,
        eventId: randomUUID(),
        eventType: 'payout.submitted',
        externalEventId: `evt_payout_submission_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
        occurredAt: acceptedAt,
        payload: {
          acceptedAt,
          amountMinor: request.amountMinor,
          currency: request.currency,
          externalPayoutId,
          externalRequestId,
          payoutReference: request.payoutReference,
          recipient: request.recipient,
          simulation: request.simulation ?? null,
          submissionTarget: request.submissionTarget,
        },
      });
    });

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

    const submittedPayout =
      await this.payoutActivityRepository.findSubmittedPayoutByExternalPayoutId(
        this.databaseService,
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
      externalPayoutId: submittedPayout.externalPayoutId,
      externalRequestId: submittedPayout.externalRequestId,
      payoutReference: submittedPayout.payoutReference,
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

    const deliveredAt = new Date().toISOString();

    await this.databaseService.transaction(async (database) => {
      await this.payoutActivityRepository.updatePayoutStatus(database, {
        externalPayoutId: request.externalPayoutId,
        nextStatus: request.status,
        updatedAt: deliveredAt,
      });

      await this.payoutActivityRepository.recordPayoutEvent(database, {
        aggregateExternalId: request.externalPayoutId,
        deliveredAt,
        eventId: randomUUID(),
        eventType: 'payout.updated',
        externalEventId,
        occurredAt,
        payload,
      });
    });

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

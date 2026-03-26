import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { type FundingSimulationRequest, type FundingSimulationResponse } from './funding.types';

@Injectable()
export class FundingService {
  async simulateFundingWebhook(
    request: FundingSimulationRequest,
  ): Promise<FundingSimulationResponse> {
    const externalEventId =
      request.externalEventId ?? `evt_funding_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const occurredAt = new Date().toISOString();
    const deliveryTarget = `${this.getTargetApiBaseUrl()}/webhooks/funding`;
    const data: FundingSimulationRequest = {
      amountMinor: request.amountMinor,
      currency: request.currency.toUpperCase(),
      destinationIdentifier: request.destinationIdentifier,
      destinationType: request.destinationType,
    };

    if (request.description !== undefined) {
      data.description = request.description;
    }

    if (request.providerReference !== undefined) {
      data.providerReference = request.providerReference;
    }

    if (request.sender !== undefined) {
      data.sender = {
        name: request.sender.name,
      };

      if (request.sender.accountIdentifier !== undefined) {
        data.sender.accountIdentifier = request.sender.accountIdentifier;
      }

      if (request.sender.bankCode !== undefined) {
        data.sender.bankCode = request.sender.bankCode;
      }

      if (request.sender.bankName !== undefined) {
        data.sender.bankName = request.sender.bankName;
      }
    }

    const payload = {
      data,
      eventType: 'funding.completed' as const,
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
}

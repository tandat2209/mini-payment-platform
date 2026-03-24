import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

interface SimulatorHealthResponse {
  service: 'simulator';
  status: 'ok';
  timestamp: string;
}

type FundingSimulationRequest = {
  amountMinor: number;
  currency: string;
  description?: string;
  destinationIdentifier: string;
  destinationType: 'account_number' | 'iban' | 'virtual_account';
  externalEventId?: string;
  providerReference?: string;
  sender?: {
    accountIdentifier?: string;
    bankCode?: string;
    bankName?: string;
    name: string;
  };
};

type FundingSimulationResponse = {
  deliveryTarget: string;
  delivered: true;
  externalEventId: string;
  payload: {
    data: FundingSimulationRequest;
    eventType: 'funding.completed';
    externalEventId: string;
    occurredAt: string;
    provider: string;
  };
  receiverResponse: Record<string, unknown>;
};

@Injectable()
export class AppService {
  getHealth(): SimulatorHealthResponse {
    return {
      status: 'ok',
      service: 'simulator',
      timestamp: new Date().toISOString(),
    };
  }

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
      provider: 'simulator_psp',
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
          : `Simulator delivery failed with status ${response.status}`,
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
    return (process.env.SIMULATOR_TARGET_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(
      /\/$/,
      '',
    );
  }
}

export type { FundingSimulationRequest, FundingSimulationResponse, SimulatorHealthResponse };

import { randomUUID } from 'node:crypto';

import { Injectable, UnprocessableEntityException } from '@nestjs/common';

interface PspSandboxHealthResponse {
  service: 'psp-sandbox';
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

type RegisterBeneficiaryRequest = {
  countryCode: string;
  currency: string;
  details: Record<string, unknown>;
  rail: 'sepa' | 'swift';
  recipientName: string;
};

type RegisterBeneficiaryResponse = {
  beneficiaryId: string;
  countryCode: string;
  currency: string;
  provider: 'psp_sandbox';
  rail: 'sepa' | 'swift';
  recipientName: string;
  registeredAt: string;
  status: 'active';
};

@Injectable()
export class AppService {
  getHealth(): PspSandboxHealthResponse {
    return {
      status: 'ok',
      service: 'psp-sandbox',
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

  async registerBeneficiary(
    request: RegisterBeneficiaryRequest,
  ): Promise<RegisterBeneficiaryResponse> {
    validateBeneficiaryRequest(request);

    return {
      beneficiaryId: `bene_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      countryCode: request.countryCode,
      currency: request.currency,
      provider: 'psp_sandbox',
      rail: request.rail,
      recipientName: request.recipientName,
      registeredAt: new Date().toISOString(),
      status: 'active',
    };
  }

  private getTargetApiBaseUrl(): string {
    return (process.env.PSP_SANDBOX_TARGET_API_BASE_URL ?? 'http://127.0.0.1:3001').replace(
      /\/$/,
      '',
    );
  }
}

function validateBeneficiaryRequest(request: RegisterBeneficiaryRequest): void {
  if (request.rail === 'sepa') {
    const iban = typeof request.details.iban === 'string' ? request.details.iban.trim() : '';

    if (!iban || !/^[A-Z]{2}[A-Z0-9]{13,32}$/u.test(iban.toUpperCase())) {
      throw new UnprocessableEntityException({
        error: 'BENEFICIARY_VALIDATION_FAILED',
        message: 'Valid IBAN is required for SEPA beneficiary registration',
      });
    }

    return;
  }

  const accountNumber =
    typeof request.details.accountNumber === 'string' ? request.details.accountNumber.trim() : '';
  const swiftCode =
    typeof request.details.swiftCode === 'string' ? request.details.swiftCode.trim() : '';

  if (!accountNumber) {
    throw new UnprocessableEntityException({
      error: 'BENEFICIARY_VALIDATION_FAILED',
      message: 'Account number is required for SWIFT beneficiary registration',
    });
  }

  if (!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/u.test(swiftCode.toUpperCase())) {
    throw new UnprocessableEntityException({
      error: 'BENEFICIARY_VALIDATION_FAILED',
      message: 'Valid SWIFT/BIC is required for SWIFT beneficiary registration',
    });
  }
}

export type {
  FundingSimulationRequest,
  FundingSimulationResponse,
  PspSandboxHealthResponse,
  RegisterBeneficiaryRequest,
  RegisterBeneficiaryResponse,
};

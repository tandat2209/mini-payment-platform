import { Injectable } from '@nestjs/common';

import {
  type ProviderManagedRecipientRegistrationResult,
  type RecipientProviderRegistrationGateway,
  type RegisterProviderManagedRecipientRailInput,
} from '../domain/recipient-provider-registration.gateway';

type SandboxBeneficiaryResponse = {
  beneficiaryId: string;
  registeredAt: string;
};

@Injectable()
export class PspSandboxRecipientProviderRegistrationGateway implements RecipientProviderRegistrationGateway {
  async registerRecipientRail(
    input: RegisterProviderManagedRecipientRailInput,
  ): Promise<ProviderManagedRecipientRegistrationResult> {
    try {
      const response = await fetch(`${this.getSandboxBaseUrl()}/beneficiaries`, {
        body: JSON.stringify(input),
        headers: {
          'content-type': 'application/json',
        },
        method: 'POST',
      });
      const payload = (await response.json()) as
        | SandboxBeneficiaryResponse
        | {
            error?: {
              message?: string;
            };
            message?: string;
          };

      if (!response.ok) {
        return {
          errorMessage:
            extractErrorMessage(payload) ??
            `PSP sandbox beneficiary registration failed with status ${response.status}`,
          status: 'failed',
        };
      }

      if (!('beneficiaryId' in payload) || !('registeredAt' in payload)) {
        return {
          errorMessage: 'PSP sandbox beneficiary registration returned an invalid success payload',
          status: 'failed',
        };
      }

      return {
        providerReference: payload.beneficiaryId,
        providerRegisteredAt: payload.registeredAt,
        status: 'active',
      };
    } catch (error) {
      return {
        errorMessage:
          error instanceof Error ? error.message : 'PSP sandbox beneficiary registration failed',
        status: 'failed',
      };
    }
  }

  private getSandboxBaseUrl(): string {
    return (process.env.PSP_SANDBOX_BASE_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  }
}

function extractErrorMessage(
  payload:
    | SandboxBeneficiaryResponse
    | {
        error?: {
          message?: string;
        };
        message?: string;
      },
): string | null {
  if ('error' in payload && typeof payload.error?.message === 'string') {
    return payload.error.message;
  }

  if ('message' in payload && typeof payload.message === 'string') {
    return payload.message;
  }

  return null;
}

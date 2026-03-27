import { Injectable } from '@nestjs/common';

import {
  type PayoutSubmissionGateway,
  type SubmitPayoutToProviderInput,
  type SubmitPayoutToProviderResult,
} from '../domain/payout-submission.gateway';

type SandboxPayoutSubmissionResponse = {
  acceptedAt: string;
  callbackMode: 'manual';
  externalPayoutId: string;
  externalRequestId: string;
  provider: 'psp_sandbox';
  simulatedFinalStatus: 'failed' | 'paid';
  status: 'accepted';
};

@Injectable()
export class PspSandboxPayoutSubmissionGateway implements PayoutSubmissionGateway {
  async submitPayout(input: SubmitPayoutToProviderInput): Promise<SubmitPayoutToProviderResult> {
    const requestPayload = {
      amountMinor: input.amountMinor,
      currency: input.currency,
      payoutReference: input.payoutReference,
      recipient: {
        countryCode: getRecipientCountryCode(input.preparedIntent),
        name: input.preparedIntent.recipientName,
        rail: input.preparedIntent.rail,
      },
      submissionTarget:
        input.preparedIntent.submissionTarget.mode === 'provider_reference'
          ? {
              beneficiaryId: input.preparedIntent.submissionTarget.providerReference,
              mode: 'provider_beneficiary' as const,
            }
          : {
              details: input.preparedIntent.submissionTarget.details,
              mode: 'inline_details' as const,
            },
    };
    const response = await fetch(`${this.getSandboxBaseUrl()}/payouts`, {
      body: JSON.stringify(requestPayload),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
    const payload = (await response.json()) as
      | SandboxPayoutSubmissionResponse
      | {
          error?: {
            message?: string;
          };
          message?: string;
        };

    if (!response.ok) {
      throw new Error(
        extractErrorMessage(payload) ??
          `PSP sandbox payout submission failed with status ${response.status}`,
      );
    }

    if (
      !('acceptedAt' in payload) ||
      !('externalPayoutId' in payload) ||
      !('externalRequestId' in payload) ||
      !('provider' in payload)
    ) {
      throw new Error('PSP sandbox payout submission returned an invalid success payload');
    }

    return {
      acceptedAt: payload.acceptedAt,
      externalPayoutId: payload.externalPayoutId,
      externalRequestId: payload.externalRequestId,
      provider: payload.provider,
      providerStatus: payload.status,
      rawResponse: payload,
    };
  }

  private getSandboxBaseUrl(): string {
    return (process.env.PSP_SANDBOX_BASE_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  }
}

function extractErrorMessage(
  payload:
    | SandboxPayoutSubmissionResponse
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

function getRecipientCountryCode(input: SubmitPayoutToProviderInput['preparedIntent']): string {
  const countryCode =
    input.submissionTarget.mode === 'inline_recipient_details'
      ? input.submissionTarget.details.countryCode
      : undefined;

  if (typeof countryCode === 'string' && /^[A-Z]{2}$/u.test(countryCode)) {
    return countryCode;
  }

  return 'US';
}

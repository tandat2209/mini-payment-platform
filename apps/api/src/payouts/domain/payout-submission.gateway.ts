import { type PreparedPayoutIntent } from './payout-preparation.types';

export type SubmitPayoutToProviderInput = {
  amountMinor: number;
  currency: string;
  payoutId: string;
  payoutReference: string;
  preparedIntent: PreparedPayoutIntent;
};

export type SubmitPayoutToProviderResult = {
  acceptedAt: string;
  externalPayoutId: string;
  externalRequestId: string;
  provider: 'psp_sandbox';
  providerStatus: 'accepted';
  rawResponse: Record<string, unknown>;
};

export interface PayoutSubmissionGateway {
  submitPayout(input: SubmitPayoutToProviderInput): Promise<SubmitPayoutToProviderResult>;
}

export const PAYOUT_SUBMISSION_GATEWAY = Symbol('PAYOUT_SUBMISSION_GATEWAY');

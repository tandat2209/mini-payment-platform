export type PayoutSubmissionRequest = {
  amountMinor: number;
  currency: string;
  payoutReference: string;
  recipient: {
    countryCode: string;
    name: string;
    rail: 'ach' | 'sepa' | 'swift';
  };
  submissionTarget:
    | {
        details: Record<string, unknown>;
        mode: 'inline_details';
      }
    | {
        beneficiaryId: string;
        mode: 'provider_beneficiary';
      };
  simulation?: {
    callbackMode?: 'manual';
    finalStatus?: 'failed' | 'paid';
  };
};

export type PayoutSubmissionResponse = {
  acceptedAt: string;
  callbackMode: 'manual';
  externalPayoutId: string;
  externalRequestId: string;
  provider: 'psp_sandbox';
  simulatedFinalStatus: 'failed' | 'paid';
  status: 'accepted';
};

export type PayoutUpdateSimulationRequest = {
  externalEventId?: string;
  externalPayoutId: string;
  failureReason?: string;
  status: 'failed' | 'paid' | 'processing';
};

export type PayoutUpdateSimulationResponse = {
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  payload: {
    data: {
      externalPayoutId: string;
      externalRequestId: string;
      failureReason?: string;
      payoutReference: string;
      status: 'failed' | 'paid' | 'processing';
    };
    eventType: 'payout.updated';
    externalEventId: string;
    occurredAt: string;
    provider: 'psp_sandbox';
  };
  receiverResponse: Record<string, unknown>;
};

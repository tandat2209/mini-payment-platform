export type FundingWebhook = {
  data: {
    amountMinor: number;
    currency: string;
    customerExternalRef: string;
    fundingDetailId: string;
  };
  eventType: 'funding.completed';
  externalEventId: string;
  occurredAt: string;
  provider: string;
};

export type RecordedWebhookEvent = {
  duplicate: boolean;
  eventType: string;
  externalEventId: string;
  id: string;
  processingStatus: string;
  provider: string;
  receivedAt: Date | string | null;
};

export interface FundingWebhookRepository {
  recordReceivedFundingWebhook(payload: FundingWebhook): Promise<RecordedWebhookEvent>;
}

export const FUNDING_WEBHOOK_REPOSITORY = Symbol('FUNDING_WEBHOOK_REPOSITORY');

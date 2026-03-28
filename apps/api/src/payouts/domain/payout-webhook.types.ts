export type PayoutWebhook = {
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
  provider: string;
};

export type RecordedPayoutWebhookEvent = {
  duplicate: boolean;
  eventType: string;
  externalEventId: string;
  id: string;
  processingStatus: string;
  provider: string;
  receivedAt: Date | string | null;
};

export type PayoutWebhook =
  | {
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
    }
  | {
      data: {
        currency: string;
        externalPayoutId: string;
        externalRequestId: string;
        payoutReference: string;
        returnReason?: string;
        returnedAmountMinor: number;
        status: 'returned';
      };
      eventType: 'payout.returned';
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

export type FundingDestinationType = 'account_number' | 'iban' | 'virtual_account';

export type FundingWebhookSender = {
  accountIdentifier?: string;
  bankCode?: string;
  bankName?: string;
  name: string;
};

export type FundingWebhook = {
  data: {
    amountMinor: number;
    currency: string;
    description?: string;
    destinationIdentifier: string;
    destinationType: FundingDestinationType;
    providerReference?: string;
    sender?: FundingWebhookSender;
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

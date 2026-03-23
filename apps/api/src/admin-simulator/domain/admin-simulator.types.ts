type AdminSimulatorFundingRequest = {
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

type AdminSimulatorFundingResponse = {
  deliveryTarget: string;
  delivered: true;
  externalEventId: string;
  payload: {
    data: AdminSimulatorFundingRequest;
    eventType: 'funding.completed';
    externalEventId: string;
    occurredAt: string;
    provider: string;
  };
  receiverResponse: Record<string, unknown>;
};

export type { AdminSimulatorFundingRequest, AdminSimulatorFundingResponse };

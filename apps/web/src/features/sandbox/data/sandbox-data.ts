type DestinationType = 'account_number' | 'iban' | 'virtual_account';

export type SandboxFundingSimulationFormState = {
  amountMinor: string;
  currency: string;
  description: string;
  destinationIdentifier: string;
  destinationType: DestinationType;
  externalEventId: string;
  providerReference: string;
  senderAccountIdentifier: string;
  senderBankCode: string;
  senderBankName: string;
  senderName: string;
};

export type SandboxFundingSimulationResult = {
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  mode: 'sandbox_live';
  postedAt: string;
  provider: string;
  providerReference: string | null;
  receiverDuplicate: boolean | null;
  receiverProcessingStatus: string | null;
  status: 'delivered';
};

export const initialSandboxFundingSimulationFormState: SandboxFundingSimulationFormState = {
  amountMinor: '2500',
  currency: 'USD',
  description: 'Salary top up',
  destinationIdentifier: '1234567890',
  destinationType: 'account_number',
  externalEventId: 'evt_sandbox_funding_001',
  providerReference: 'bank-ref-preview-001',
  senderAccountIdentifier: '99887766',
  senderBankCode: 'VCB',
  senderBankName: 'Vietcombank',
  senderName: 'Alice Nguyen',
};

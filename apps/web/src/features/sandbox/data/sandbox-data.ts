type DestinationType = 'account_number' | 'iban' | 'virtual_account';
type PayoutUpdateStatus = 'failed' | 'paid' | 'processing' | 'returned';

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

export type SandboxPayoutUpdateFormState = {
  externalEventId: string;
  externalPayoutId: string;
  failureReason: string;
  returnedAmountMinor: string;
  status: PayoutUpdateStatus;
};

export type SandboxPayoutUpdateResult = {
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  payoutReference: string;
  postedAt: string;
  provider: 'psp_sandbox';
  receiverDuplicate: boolean | null;
  receiverProcessingStatus: string | null;
  returnedAmountMinor: string | null;
  status: PayoutUpdateStatus;
};

export type SandboxReconciliationReportFormState = {
  externalEventId: string;
  providerReportId: string;
  reportDate: string;
};

export type SandboxReconciliationReportResult = {
  delivered: true;
  deliveryTarget: string;
  externalEventId: string;
  lineCount: string;
  postedAt: string;
  provider: 'psp_sandbox';
  providerReportId: string;
  receiverDuplicate: boolean | null;
  receiverProcessingStatus: string | null;
  reportDate: string;
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

export const initialSandboxPayoutUpdateFormState: SandboxPayoutUpdateFormState = {
  externalEventId: 'evt_sandbox_payout_001',
  externalPayoutId: 'ppay_',
  failureReason: 'Beneficiary bank rejected the payout.',
  returnedAmountMinor: '2503',
  status: 'processing',
};

export const initialSandboxReconciliationReportFormState: SandboxReconciliationReportFormState = {
  externalEventId: 'evt_sandbox_reconciliation_001',
  providerReportId: 'rpt_20260329_psp_sandbox',
  reportDate: '2026-03-29',
};

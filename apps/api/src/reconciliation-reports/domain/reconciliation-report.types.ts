export type ReconciliationLineOutcome =
  | 'amount_mismatch'
  | 'duplicate_provider_line'
  | 'internal_only'
  | 'matched'
  | 'provider_only'
  | 'status_mismatch'
  | 'timing_difference'
  | 'unsupported_report_line';

export type ReconciliationExceptionSeverity = 'high' | 'medium';

export type ReconciliationReportLine =
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalEventId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'funding';
      netAmountMinor: number;
      providerReference: string | null;
      status: 'completed';
      walletId: string;
    }
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalPayoutId: string;
      externalRequestId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'payout';
      netAmountMinor: number;
      payoutId: string;
      recipientName: string | null;
      status: 'failed' | 'paid' | 'processing' | 'submitted';
      walletId: string;
    }
  | {
      currency: string;
      customerExternalRef: string;
      eventTimestamp: string;
      externalPayoutId: string;
      externalRequestId: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      internalReference: string | null;
      lineId: string;
      lineType: 'return';
      netAmountMinor: number;
      payoutId: string;
      returnedAmountMinor: number;
      status: 'returned';
      walletId: string;
    };

export type ReconciliationReportWebhook = {
  data: {
    lineCount: number;
    lines: ReconciliationReportLine[];
    providerReportId: string;
    reportDate: string;
    reportWindowEnd: string;
    reportWindowStart: string;
  };
  eventType: 'reconciliation.report.generated';
  externalEventId: string;
  occurredAt: string;
  provider: string;
};

export type RecordedReconciliationReportEvent = {
  batchId: string | null;
  duplicate: boolean;
  eventType: string;
  externalEventId: string;
  id: string;
  processingStatus: string;
  provider: string;
  providerReportId: string | null;
  receivedAt: Date | string | null;
};

export type StoredReconciliationReportLine = {
  batchId: string;
  currency: string;
  customerExternalRef: string;
  eventTimestamp: Date | string;
  externalEventId: string | null;
  externalPayoutId: string | null;
  externalRequestId: string | null;
  feeAmountMinor: number;
  grossAmountMinor: number;
  id: string;
  internalReference: string | null;
  lineIndex: number;
  lineStatus: string;
  lineType: ReconciliationReportLine['lineType'];
  netAmountMinor: number;
  payoutId: string | null;
  providerLineId: string;
  returnedAmountMinor: number | null;
  walletId: string | null;
};

export type FundingReconciliationMatchCandidate = {
  currency: string | null;
  feeAmountMinor: number | null;
  grossAmountMinor: number | null;
  ledgerTransactionId: string | null;
  ledgerTransactionStatus: string | null;
  netAmountMinor: number | null;
  userTransactionId: string | null;
  userTransactionStatus: string | null;
  webhookEventId: string;
  webhookProcessingStatus: string;
};

export type PayoutReconciliationMatchCandidate = {
  attemptStatus: string | null;
  currency: string;
  feeAmountMinor: number;
  grossAmountMinor: number;
  netAmountMinor: number;
  payoutAttemptId: string;
  payoutId: string;
  payoutStatus: string;
  returnCreditTransactionId: string | null;
  returnedAmountMinor: number | null;
  reversalLedgerTransactionId: string | null;
  settlementLedgerTransactionId: string | null;
  userTransactionId: string;
  webhookEventId: string | null;
};

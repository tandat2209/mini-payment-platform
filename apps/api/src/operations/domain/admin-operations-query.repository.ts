export type AdminReconciliationReportBatchView = {
  exceptionCount: number;
  id: string;
  lineCount: number;
  matchedCount: number;
  processedAt: Date | string | null;
  processingStatus: string;
  provider: string;
  providerReportId: string;
  receivedAt: Date | string;
  reportDate: Date | string;
  reportWindowEnd: Date | string;
  reportWindowStart: Date | string;
};

export type AdminReconciliationReportLineView = {
  batchId: string;
  currency: string;
  customerExternalRef: string;
  eventTimestamp: Date | string;
  externalEventId: string | null;
  externalPayoutId: string | null;
  externalRequestId: string | null;
  feeAmountMinor: string;
  grossAmountMinor: string;
  id: string;
  linkedLedgerTransactionId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  internalMatchPayload: Record<string, unknown> | null;
  netAmountMinor: string;
  outcome: string | null;
  outcomeSummary: string | null;
  providerLineId: string;
  providerReportId: string;
  rawReportPayload: Record<string, unknown>;
  returnedAmountMinor: string | null;
  severity: 'high' | 'medium' | null;
  status: string;
  type: string;
};

export type AdminWebhookEventView = {
  eventType: string;
  externalEventId: string;
  id: string;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  payload: Record<string, unknown>;
  processingStatus: string;
  processedAt: Date | string | null;
  provider: string;
  receivedAt: Date | string;
};

export type AdminReconciliationExceptionView = {
  kind: string;
  linkedLedgerTransactionId: string | null;
  linkedPayoutId: string | null;
  linkedTransactionId: string | null;
  linkedWebhookEventId: string | null;
  occurredAt: Date | string;
  reference: string | null;
  severity: 'high' | 'medium';
  sourceId: string;
  summary: string;
};

export interface AdminOperationsQueryRepository {
  listReconciliationReportBatches(): Promise<AdminReconciliationReportBatchView[]>;
  listReconciliationExceptions(): Promise<AdminReconciliationExceptionView[]>;
  listReconciliationReportLines(): Promise<AdminReconciliationReportLineView[]>;
  listWebhookEvents(): Promise<AdminWebhookEventView[]>;
}

export const ADMIN_OPERATIONS_QUERY_REPOSITORY = Symbol('ADMIN_OPERATIONS_QUERY_REPOSITORY');

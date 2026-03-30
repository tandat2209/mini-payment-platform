import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type FundingReconciliationMatchCandidate,
  type PayoutReconciliationMatchCandidate,
  type ReconciliationExceptionSeverity,
  type ReconciliationLineOutcome,
  type ReconciliationReportLine,
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
  type StoredReconciliationReportLine,
} from './reconciliation-report.types';

export type StoredReconciliationBatch = {
  id: string;
  provider: string;
  providerReportId: string;
  receivedAt: Date | string;
};

export interface ReconciliationReportStore {
  deleteExceptionForLine(context: TransactionContext, lineId: string): Promise<void>;
  findBatchByProviderReportId(
    context: TransactionContext,
    provider: string,
    providerReportId: string,
  ): Promise<StoredReconciliationBatch | null>;
  findDuplicateProviderLine(
    context: TransactionContext,
    provider: string,
    providerLineId: string,
    excludingBatchId: string,
  ): Promise<{ batchId: string; lineId: string } | null>;
  findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedReconciliationReportEvent | null>;
  findFundingMatchCandidate(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<FundingReconciliationMatchCandidate | null>;
  findPayoutMatchCandidate(
    context: TransactionContext,
    input: {
      externalPayoutId: string;
      externalRequestId: string;
      payoutId: string;
      provider: string;
    },
  ): Promise<PayoutReconciliationMatchCandidate | null>;
  listBatchLines(
    context: TransactionContext,
    batchId: string,
  ): Promise<StoredReconciliationReportLine[]>;
  markBatchAndLinesProcessed(
    context: TransactionContext,
    batchId: string,
    processedAt: string,
  ): Promise<void>;
  markWebhookProcessingStatus(
    context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedReconciliationReportEvent>;
  recordBatch(
    context: TransactionContext,
    input: {
      batchId: string;
      lineCount: number;
      payload: ReconciliationReportWebhook;
      providerReportId: string;
      receivedAt: string;
      reportDate: string;
      reportWindowEnd: string;
      reportWindowStart: string;
      webhookEventId: string;
    },
  ): Promise<StoredReconciliationBatch | null>;
  recordLines(
    context: TransactionContext,
    batchId: string,
    lines: ReconciliationReportLine[],
    receivedAt: string,
  ): Promise<void>;
  recordReceivedWebhook(
    context: TransactionContext,
    payload: ReconciliationReportWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedReconciliationReportEvent | null>;
  upsertException(
    context: TransactionContext,
    input: {
      batchId: string;
      createdAt: string;
      lineId: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutAttemptId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      outcome: ReconciliationLineOutcome;
      severity: ReconciliationExceptionSeverity;
      summary: string;
      updatedAt: string;
    },
  ): Promise<void>;
  updateLineClassification(
    context: TransactionContext,
    input: {
      classifiedAt: string;
      lineId: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutAttemptId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      outcome: ReconciliationLineOutcome;
      summary: string;
      updatedAt: string;
    },
  ): Promise<void>;
}

export const RECONCILIATION_REPORT_STORE = Symbol('RECONCILIATION_REPORT_STORE');

import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type ReconciliationReportLine,
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
} from './reconciliation-report.types';

export type StoredReconciliationBatch = {
  id: string;
  provider: string;
  providerReportId: string;
  receivedAt: Date | string;
};

export interface ReconciliationReportStore {
  findBatchByProviderReportId(
    context: TransactionContext,
    provider: string,
    providerReportId: string,
  ): Promise<StoredReconciliationBatch | null>;
  findByProviderEvent(
    context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedReconciliationReportEvent | null>;
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
}

export const RECONCILIATION_REPORT_STORE = Symbol('RECONCILIATION_REPORT_STORE');

import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import { toStructuredLog } from '../../shared/logging/structured-log';
import {
  RECONCILIATION_REPORT_STORE,
  type ReconciliationReportStore,
} from '../domain/reconciliation-report.store';
import {
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
} from '../domain/reconciliation-report.types';
import { ReconciliationLineClassifierService } from './reconciliation-line-classifier.service';

@Injectable()
export class ApplyReconciliationReportService {
  private readonly logger = new Logger(ApplyReconciliationReportService.name);

  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    @Inject(RECONCILIATION_REPORT_STORE)
    private readonly reconciliationReportStore: ReconciliationReportStore,
    private readonly reconciliationLineClassifierService: ReconciliationLineClassifierService,
  ) {}

  async execute(payload: ReconciliationReportWebhook): Promise<RecordedReconciliationReportEvent> {
    this.logger.log(
      toStructuredLog({
        event: 'reconciliation_report_processing_started',
        externalEventId: payload.externalEventId,
        lineCount: payload.data.lineCount,
        provider: payload.provider,
        providerReportId: payload.data.providerReportId,
        reportDate: payload.data.reportDate,
      }),
    );

    return await this.transactionManager.runInTransaction(async (context) => {
      const webhookId = randomUUID();
      const now = new Date().toISOString();
      const insertedWebhook = await this.reconciliationReportStore.recordReceivedWebhook(
        context,
        payload,
        webhookId,
        now,
      );

      if (!insertedWebhook) {
        const existingEvent = await this.reconciliationReportStore.findByProviderEvent(
          context,
          payload.provider,
          payload.externalEventId,
        );

        if (!existingEvent) {
          throw new Error(
            'Reconciliation report webhook could not be loaded after duplicate detection',
          );
        }

        this.logger.warn(
          toStructuredLog({
            event: 'reconciliation_report_duplicate_event_detected',
            externalEventId: payload.externalEventId,
            processingStatus: existingEvent.processingStatus,
            provider: payload.provider,
            providerReportId: payload.data.providerReportId,
            webhookEventId: existingEvent.id,
          }),
        );

        return {
          ...existingEvent,
          duplicate: true,
          providerReportId: payload.data.providerReportId,
        };
      }

      const batchId = randomUUID();
      const storedBatch = await this.reconciliationReportStore.recordBatch(context, {
        batchId,
        lineCount: payload.data.lineCount,
        payload,
        providerReportId: payload.data.providerReportId,
        receivedAt: now,
        reportDate: payload.data.reportDate,
        reportWindowEnd: payload.data.reportWindowEnd,
        reportWindowStart: payload.data.reportWindowStart,
        webhookEventId: insertedWebhook.id,
      });

      if (!storedBatch) {
        const existingBatch = await this.reconciliationReportStore.findBatchByProviderReportId(
          context,
          payload.provider,
          payload.data.providerReportId,
        );

        const processedEvent = await this.reconciliationReportStore.markWebhookProcessingStatus(
          context,
          insertedWebhook.id,
          'processed',
          now,
        );

        this.logger.warn(
          toStructuredLog({
            batchId: existingBatch?.id ?? null,
            event: 'reconciliation_report_duplicate_batch_detected',
            externalEventId: payload.externalEventId,
            provider: payload.provider,
            providerReportId: payload.data.providerReportId,
            webhookEventId: insertedWebhook.id,
          }),
        );

        return {
          ...processedEvent,
          batchId: existingBatch?.id ?? null,
          duplicate: true,
          providerReportId: payload.data.providerReportId,
        };
      }

      await this.reconciliationReportStore.recordLines(
        context,
        storedBatch.id,
        payload.data.lines,
        now,
      );
      await this.reconciliationLineClassifierService.classifyBatch(
        context,
        storedBatch.id,
        payload.provider,
        now,
      );
      await this.reconciliationReportStore.markBatchAndLinesProcessed(context, storedBatch.id, now);
      const processedEvent = await this.reconciliationReportStore.markWebhookProcessingStatus(
        context,
        insertedWebhook.id,
        'processed',
        now,
      );

      this.logger.log(
        toStructuredLog({
          batchId: storedBatch.id,
          event: 'reconciliation_report_processed',
          externalEventId: payload.externalEventId,
          lineCount: payload.data.lineCount,
          provider: payload.provider,
          providerReportId: payload.data.providerReportId,
          webhookEventId: insertedWebhook.id,
        }),
      );

      return {
        ...processedEvent,
        batchId: storedBatch.id,
        duplicate: false,
        providerReportId: payload.data.providerReportId,
      };
    });
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  ValidationPipe,
} from '@nestjs/common';

import { toIsoTimestamp } from '../../shared/api/api-primitives';
import { toStructuredLog } from '../../shared/logging/structured-log';
import { RecordReconciliationReportCommand } from '../application/commands/record-reconciliation-report.command';
import { ReconciliationReportWebhookRequestDto } from './reconciliation-report-webhook.dto';

type ReconciliationReportWebhookResponse = {
  accepted: true;
  batch: {
    id: string | null;
    providerReportId: string | null;
  };
  duplicate: boolean;
  event: {
    eventType: string;
    externalEventId: string;
    id: string;
    processingStatus: string;
    provider: string;
    receivedAt: string | null;
  };
};

const reconciliationReportValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller('webhooks/reconciliation-reports')
export class ReconciliationReportsController {
  private readonly logger = new Logger(ReconciliationReportsController.name);

  constructor(
    private readonly recordReconciliationReportCommand: RecordReconciliationReportCommand,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async recordReconciliationReport(
    @Body(reconciliationReportValidationPipe) body: ReconciliationReportWebhookRequestDto,
  ): Promise<ReconciliationReportWebhookResponse> {
    this.logger.log(
      toStructuredLog({
        event: 'reconciliation_report_webhook_received',
        externalEventId: body.externalEventId,
        lineCount: body.data.lineCount,
        provider: body.provider,
        providerReportId: body.data.providerReportId,
        reportDate: body.data.reportDate,
      }),
    );
    const recordedEvent = await this.recordReconciliationReportCommand.execute(body.toDomain());

    this.logger.log(
      toStructuredLog({
        batchId: recordedEvent.batchId,
        duplicate: recordedEvent.duplicate,
        event: 'reconciliation_report_webhook_recorded',
        externalEventId: recordedEvent.externalEventId,
        processingStatus: recordedEvent.processingStatus,
        provider: recordedEvent.provider,
        providerReportId: recordedEvent.providerReportId,
        webhookEventId: recordedEvent.id,
      }),
    );

    return {
      accepted: true,
      batch: {
        id: recordedEvent.batchId,
        providerReportId: recordedEvent.providerReportId,
      },
      duplicate: recordedEvent.duplicate,
      event: {
        eventType: recordedEvent.eventType,
        externalEventId: recordedEvent.externalEventId,
        id: recordedEvent.id,
        processingStatus: recordedEvent.processingStatus,
        provider: recordedEvent.provider,
        receivedAt: toIsoTimestamp(recordedEvent.receivedAt),
      },
    };
  }
}

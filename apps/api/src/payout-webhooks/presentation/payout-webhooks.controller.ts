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
import { RecordPayoutWebhookCommand } from '../application/commands/record-payout-webhook.command';
import { PayoutWebhookRequestDto } from './payout-webhook.dto';

type PayoutWebhookResponse = {
  accepted: true;
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

const payoutWebhookValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller('webhooks/payouts')
export class PayoutWebhooksController {
  private readonly logger = new Logger(PayoutWebhooksController.name);

  constructor(private readonly recordPayoutWebhookCommand: RecordPayoutWebhookCommand) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async recordPayoutWebhook(
    @Body(payoutWebhookValidationPipe) body: PayoutWebhookRequestDto,
  ): Promise<PayoutWebhookResponse> {
    this.logger.log(
      toStructuredLog({
        event: 'payout_webhook_received',
        externalEventId: body.externalEventId,
        externalPayoutId: body.data.externalPayoutId,
        provider: body.provider,
        status: body.data.status,
      }),
    );
    const recordedEvent = await this.recordPayoutWebhookCommand.execute(body.toDomain());

    this.logger.log(
      toStructuredLog({
        duplicate: recordedEvent.duplicate,
        event: 'payout_webhook_recorded',
        externalEventId: recordedEvent.externalEventId,
        processingStatus: recordedEvent.processingStatus,
        provider: recordedEvent.provider,
        webhookEventId: recordedEvent.id,
      }),
    );

    return {
      accepted: true,
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

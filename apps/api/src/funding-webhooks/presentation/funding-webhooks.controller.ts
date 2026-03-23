import { Body, Controller, HttpCode, HttpStatus, Post, ValidationPipe } from '@nestjs/common';

import { toIsoTimestamp } from '../../shared/api/api-primitives';
import { RecordFundingWebhookCommand } from '../application/commands/record-funding-webhook.command';
import { FundingWebhookRequestDto } from './funding-webhook.dto';

type FundingWebhookResponse = {
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

const fundingWebhookValidationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});

@Controller('webhooks/funding')
export class FundingWebhooksController {
  constructor(private readonly recordFundingWebhookCommand: RecordFundingWebhookCommand) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async recordFundingWebhook(
    @Body(fundingWebhookValidationPipe) body: FundingWebhookRequestDto,
  ): Promise<FundingWebhookResponse> {
    const recordedEvent = await this.recordFundingWebhookCommand.execute(body.toDomain());

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

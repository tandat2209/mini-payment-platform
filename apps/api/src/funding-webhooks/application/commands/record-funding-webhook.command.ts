import { Inject, Injectable } from '@nestjs/common';

import {
  FUNDING_WEBHOOK_REPOSITORY,
  type FundingWebhook,
  type FundingWebhookRepository,
  type RecordedWebhookEvent,
} from '../../domain/funding-webhook.repository';

@Injectable()
export class RecordFundingWebhookCommand {
  constructor(
    @Inject(FUNDING_WEBHOOK_REPOSITORY)
    private readonly fundingWebhookRepository: FundingWebhookRepository,
  ) {}

  execute(payload: FundingWebhook): Promise<RecordedWebhookEvent> {
    return this.fundingWebhookRepository.recordReceivedFundingWebhook(payload);
  }
}

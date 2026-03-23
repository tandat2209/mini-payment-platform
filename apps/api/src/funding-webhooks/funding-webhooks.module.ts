import { Module } from '@nestjs/common';

import { RecordFundingWebhookCommand } from './application/commands/record-funding-webhook.command';
import { FUNDING_WEBHOOK_REPOSITORY } from './domain/funding-webhook.repository';
import { SqlFundingWebhookRepository } from './infrastructure/sql-funding-webhook.repository';
import { FundingWebhooksController } from './presentation/funding-webhooks.controller';

@Module({
  controllers: [FundingWebhooksController],
  providers: [
    RecordFundingWebhookCommand,
    SqlFundingWebhookRepository,
    {
      provide: FUNDING_WEBHOOK_REPOSITORY,
      useExisting: SqlFundingWebhookRepository,
    },
  ],
})
export class FundingWebhooksModule {}

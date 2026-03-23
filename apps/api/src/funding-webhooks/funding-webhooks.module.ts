import { Module } from '@nestjs/common';

import { FundingModule } from '../funding/funding.module';
import { RecordFundingWebhookCommand } from './application/commands/record-funding-webhook.command';
import { FundingWebhooksController } from './presentation/funding-webhooks.controller';

@Module({
  imports: [FundingModule],
  controllers: [FundingWebhooksController],
  providers: [RecordFundingWebhookCommand],
})
export class FundingWebhooksModule {}

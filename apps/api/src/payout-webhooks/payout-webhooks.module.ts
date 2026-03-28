import { Module } from '@nestjs/common';

import { PayoutsModule } from '../payouts/payouts.module';
import { RecordPayoutWebhookCommand } from './application/commands/record-payout-webhook.command';
import { PayoutWebhooksController } from './presentation/payout-webhooks.controller';

@Module({
  imports: [PayoutsModule],
  controllers: [PayoutWebhooksController],
  providers: [RecordPayoutWebhookCommand],
})
export class PayoutWebhooksModule {}

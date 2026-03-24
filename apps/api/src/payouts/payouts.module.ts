import { Module } from '@nestjs/common';

import { PreparePayoutIntentService } from './application/prepare-payout-intent.service';
import { PAYOUT_RECIPIENT_RAIL_REPOSITORY } from './domain/payout-recipient-rail.repository';
import { SqlPayoutRecipientRailRepository } from './infrastructure/sql-payout-recipient-rail.repository';

@Module({
  providers: [
    PreparePayoutIntentService,
    SqlPayoutRecipientRailRepository,
    {
      provide: PAYOUT_RECIPIENT_RAIL_REPOSITORY,
      useExisting: SqlPayoutRecipientRailRepository,
    },
  ],
  exports: [PreparePayoutIntentService],
})
export class PayoutsModule {}

import { Module } from '@nestjs/common';

import { PAYOUT_ACTIVITY_REPOSITORY } from './payout-activity.repository';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { SqlPayoutActivityRepository } from './sql-payout-activity.repository';

@Module({
  controllers: [PayoutsController],
  providers: [
    PayoutsService,
    SqlPayoutActivityRepository,
    {
      provide: PAYOUT_ACTIVITY_REPOSITORY,
      useExisting: SqlPayoutActivityRepository,
    },
  ],
  exports: [PayoutsService],
})
export class PayoutsModule {}

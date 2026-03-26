import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ExecutePayoutService } from './application/execute-payout.service';
import { PreparePayoutIntentService } from './application/prepare-payout-intent.service';
import { PAYOUT_RECIPIENT_RAIL_REPOSITORY } from './domain/payout-recipient-rail.repository';
import {
  PAYOUT_WALLET_REPOSITORY,
  PAYOUT_WRITE_REPOSITORY,
} from './domain/payout-write.repositories';
import { SqlPayoutRecipientRailRepository } from './infrastructure/sql-payout-recipient-rail.repository';
import { SqlPayoutWalletRepository } from './infrastructure/sql-payout-wallet.repository';
import { SqlPayoutWriteRepository } from './infrastructure/sql-payout-write.repository';
import { PayoutsController } from './presentation/customer-api/payouts.controller';

@Module({
  imports: [DatabaseModule, LedgerModule],
  controllers: [PayoutsController],
  providers: [
    PreparePayoutIntentService,
    ExecutePayoutService,
    SqlPayoutRecipientRailRepository,
    SqlPayoutWalletRepository,
    SqlPayoutWriteRepository,
    {
      provide: PAYOUT_RECIPIENT_RAIL_REPOSITORY,
      useExisting: SqlPayoutRecipientRailRepository,
    },
    {
      provide: PAYOUT_WALLET_REPOSITORY,
      useExisting: SqlPayoutWalletRepository,
    },
    {
      provide: PAYOUT_WRITE_REPOSITORY,
      useExisting: SqlPayoutWriteRepository,
    },
  ],
  exports: [PreparePayoutIntentService, ExecutePayoutService],
})
export class PayoutsModule {}

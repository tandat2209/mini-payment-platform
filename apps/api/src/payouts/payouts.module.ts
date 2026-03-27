import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ExecutePayoutService } from './application/execute-payout.service';
import { PreparePayoutIntentService } from './application/prepare-payout-intent.service';
import { PAYOUT_IDEMPOTENCY_REPOSITORY } from './domain/payout-idempotency.repository';
import { PAYOUT_RECIPIENT_RAIL_REPOSITORY } from './domain/payout-recipient-rail.repository';
import { PAYOUT_SUBMISSION_GATEWAY } from './domain/payout-submission.gateway';
import {
  PAYOUT_WALLET_REPOSITORY,
  PAYOUT_WRITE_REPOSITORY,
} from './domain/payout-write.repositories';
import { PspSandboxPayoutSubmissionGateway } from './infrastructure/psp-sandbox-payout-submission.gateway';
import { SqlPayoutIdempotencyRepository } from './infrastructure/sql-payout-idempotency.repository';
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
    SqlPayoutIdempotencyRepository,
    SqlPayoutRecipientRailRepository,
    SqlPayoutWalletRepository,
    SqlPayoutWriteRepository,
    PspSandboxPayoutSubmissionGateway,
    {
      provide: PAYOUT_IDEMPOTENCY_REPOSITORY,
      useExisting: SqlPayoutIdempotencyRepository,
    },
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
    {
      provide: PAYOUT_SUBMISSION_GATEWAY,
      useExisting: PspSandboxPayoutSubmissionGateway,
    },
  ],
  exports: [PreparePayoutIntentService, ExecutePayoutService],
})
export class PayoutsModule {}

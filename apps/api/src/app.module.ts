import { Module } from '@nestjs/common';

import { CustomerAccessModule } from './access/customer/customer-access.module';
import { DatabaseModule } from './database/database.module';
import { FundingModule } from './funding/funding.module';
import { FundingWebhooksModule } from './funding-webhooks/funding-webhooks.module';
import { HealthModule } from './health/health.module';
import { LedgerModule } from './ledger/ledger.module';
import { PayoutWebhooksModule } from './payout-webhooks/payout-webhooks.module';
import { PayoutsModule } from './payouts/payouts.module';
import { RecipientsModule } from './recipients/recipients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    DatabaseModule,
    CustomerAccessModule,
    FundingModule,
    FundingWebhooksModule,
    LedgerModule,
    PayoutsModule,
    PayoutWebhooksModule,
    WalletsModule,
    TransactionsModule,
    RecipientsModule,
    HealthModule,
  ],
})
export class AppModule {}

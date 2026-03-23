import { Module } from '@nestjs/common';

import { CustomerAccessModule } from './access/customer/customer-access.module';
import { AdminSimulatorModule } from './admin-simulator/admin-simulator.module';
import { DatabaseModule } from './database/database.module';
import { FundingModule } from './funding/funding.module';
import { FundingWebhooksModule } from './funding-webhooks/funding-webhooks.module';
import { HealthModule } from './health/health.module';
import { LedgerModule } from './ledger/ledger.module';
import { RecipientsModule } from './recipients/recipients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    DatabaseModule,
    AdminSimulatorModule,
    CustomerAccessModule,
    FundingModule,
    FundingWebhooksModule,
    LedgerModule,
    WalletsModule,
    TransactionsModule,
    RecipientsModule,
    HealthModule,
  ],
})
export class AppModule {}

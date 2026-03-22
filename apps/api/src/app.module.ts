import { Module } from '@nestjs/common';

import { CustomerAccessModule } from './access/customer/customer-access.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { RecipientsModule } from './recipients/recipients.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WalletsModule } from './wallets/wallets.module';

@Module({
  imports: [
    DatabaseModule,
    CustomerAccessModule,
    WalletsModule,
    TransactionsModule,
    RecipientsModule,
    HealthModule,
  ],
})
export class AppModule {}

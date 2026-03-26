import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BeneficiariesModule } from './beneficiaries/beneficiaries.module';
import { DatabaseModule } from './database/database.module';
import { FundingModule } from './funding/funding.module';
import { PayoutsModule } from './payouts/payouts.module';

@Module({
  imports: [DatabaseModule, FundingModule, BeneficiariesModule, PayoutsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

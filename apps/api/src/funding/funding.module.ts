import { Module } from '@nestjs/common';

import { LedgerModule } from '../ledger/ledger.module';
import { ApplyInboundFundingService } from './application/apply-inbound-funding.service';
import {
  FUNDING_TARGET_REPOSITORY,
  FUNDING_TRANSACTION_WRITER,
  FUNDING_WEBHOOK_STORE,
  WALLET_BALANCE_WRITER,
} from './domain/funding.repositories';
import { SqlFundingTargetRepository } from './infrastructure/sql-funding-target.repository';
import { SqlFundingTransactionWriter } from './infrastructure/sql-funding-transaction.writer';
import { SqlFundingWebhookStore } from './infrastructure/sql-funding-webhook.store';
import { SqlWalletBalanceWriter } from './infrastructure/sql-wallet-balance.writer';

@Module({
  imports: [LedgerModule],
  providers: [
    ApplyInboundFundingService,
    SqlFundingWebhookStore,
    SqlFundingTargetRepository,
    SqlWalletBalanceWriter,
    SqlFundingTransactionWriter,
    {
      provide: FUNDING_WEBHOOK_STORE,
      useExisting: SqlFundingWebhookStore,
    },
    {
      provide: FUNDING_TARGET_REPOSITORY,
      useExisting: SqlFundingTargetRepository,
    },
    {
      provide: WALLET_BALANCE_WRITER,
      useExisting: SqlWalletBalanceWriter,
    },
    {
      provide: FUNDING_TRANSACTION_WRITER,
      useExisting: SqlFundingTransactionWriter,
    },
  ],
  exports: [ApplyInboundFundingService],
})
export class FundingModule {}

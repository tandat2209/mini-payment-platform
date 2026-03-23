import { Module } from '@nestjs/common';

import { LedgerAccountService } from './application/ledger-account.service';
import { LedgerPostingService } from './application/ledger-posting.service';
import { LEDGER_ACCOUNT_REPOSITORY, LEDGER_POSTING_REPOSITORY } from './domain/ledger.repositories';
import { SqlLedgerAccountRepository } from './infrastructure/sql-ledger-account.repository';
import { SqlLedgerPostingRepository } from './infrastructure/sql-ledger-posting.repository';

@Module({
  providers: [
    LedgerAccountService,
    LedgerPostingService,
    SqlLedgerAccountRepository,
    SqlLedgerPostingRepository,
    {
      provide: LEDGER_ACCOUNT_REPOSITORY,
      useExisting: SqlLedgerAccountRepository,
    },
    {
      provide: LEDGER_POSTING_REPOSITORY,
      useExisting: SqlLedgerPostingRepository,
    },
  ],
  exports: [LedgerAccountService, LedgerPostingService],
})
export class LedgerModule {}

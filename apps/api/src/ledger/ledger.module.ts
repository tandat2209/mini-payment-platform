import { Module } from '@nestjs/common';

import { GetAdminLedgersQuery } from './application/get-admin-ledgers.query';
import { LedgerAccountService } from './application/ledger-account.service';
import { LedgerPostingService } from './application/ledger-posting.service';
import { ADMIN_LEDGER_QUERY_REPOSITORY } from './domain/admin-ledger-query.repository';
import { LEDGER_ACCOUNT_REPOSITORY, LEDGER_POSTING_REPOSITORY } from './domain/ledger.repositories';
import { SqlAdminLedgerQueryRepository } from './infrastructure/sql-admin-ledger-query.repository';
import { SqlLedgerAccountRepository } from './infrastructure/sql-ledger-account.repository';
import { SqlLedgerPostingRepository } from './infrastructure/sql-ledger-posting.repository';
import { AdminLedgersController } from './presentation/admin-api/admin-ledgers.controller';

@Module({
  controllers: [AdminLedgersController],
  providers: [
    GetAdminLedgersQuery,
    LedgerAccountService,
    LedgerPostingService,
    SqlAdminLedgerQueryRepository,
    SqlLedgerAccountRepository,
    SqlLedgerPostingRepository,
    {
      provide: ADMIN_LEDGER_QUERY_REPOSITORY,
      useExisting: SqlAdminLedgerQueryRepository,
    },
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

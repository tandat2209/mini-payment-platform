import { Module } from '@nestjs/common';

import { GetAdminTransactionsQuery } from './application/queries/get-admin-transactions.query';
import { GetStatementsQuery } from './application/queries/get-statements.query';
import { GetTransactionsQuery } from './application/queries/get-transactions.query';
import { ADMIN_TRANSACTION_QUERY_REPOSITORY } from './domain/admin-transaction-query.repository';
import { STATEMENT_QUERY_REPOSITORY } from './domain/statement-query.repository';
import { TRANSACTION_QUERY_REPOSITORY } from './domain/transaction-query.repository';
import { SqlAdminTransactionQueryRepository } from './infrastructure/sql-admin-transaction-query.repository';
import { SqlStatementQueryRepository } from './infrastructure/sql-statement-query.repository';
import { SqlTransactionQueryRepository } from './infrastructure/sql-transaction-query.repository';
import { AdminTransactionsController } from './presentation/admin-api/admin-transactions.controller';
import { StatementsController } from './presentation/customer-api/statements.controller';
import { TransactionsController } from './presentation/customer-api/transactions.controller';

@Module({
  controllers: [TransactionsController, StatementsController, AdminTransactionsController],
  providers: [
    GetAdminTransactionsQuery,
    GetTransactionsQuery,
    GetStatementsQuery,
    SqlAdminTransactionQueryRepository,
    SqlTransactionQueryRepository,
    SqlStatementQueryRepository,
    {
      provide: ADMIN_TRANSACTION_QUERY_REPOSITORY,
      useExisting: SqlAdminTransactionQueryRepository,
    },
    {
      provide: TRANSACTION_QUERY_REPOSITORY,
      useExisting: SqlTransactionQueryRepository,
    },
    {
      provide: STATEMENT_QUERY_REPOSITORY,
      useExisting: SqlStatementQueryRepository,
    },
  ],
})
export class TransactionsModule {}

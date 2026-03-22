import { Module } from '@nestjs/common';

import { GetStatementsQuery } from './application/queries/get-statements.query';
import { GetTransactionsQuery } from './application/queries/get-transactions.query';
import { STATEMENT_QUERY_REPOSITORY } from './domain/statement-query.repository';
import { TRANSACTION_QUERY_REPOSITORY } from './domain/transaction-query.repository';
import { SqlStatementQueryRepository } from './infrastructure/sql-statement-query.repository';
import { SqlTransactionQueryRepository } from './infrastructure/sql-transaction-query.repository';
import { StatementsController } from './presentation/customer-api/statements.controller';
import { TransactionsController } from './presentation/customer-api/transactions.controller';

@Module({
  controllers: [TransactionsController, StatementsController],
  providers: [
    GetTransactionsQuery,
    GetStatementsQuery,
    SqlTransactionQueryRepository,
    SqlStatementQueryRepository,
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

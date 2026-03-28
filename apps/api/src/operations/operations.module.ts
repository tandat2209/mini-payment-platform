import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { GetAdminOperationsQuery } from './application/get-admin-operations.query';
import { ADMIN_OPERATIONS_QUERY_REPOSITORY } from './domain/admin-operations-query.repository';
import { SqlAdminOperationsQueryRepository } from './infrastructure/sql-admin-operations-query.repository';
import { AdminReconciliationController } from './presentation/admin-api/admin-reconciliation.controller';
import { AdminWebhooksController } from './presentation/admin-api/admin-webhooks.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminWebhooksController, AdminReconciliationController],
  providers: [
    GetAdminOperationsQuery,
    SqlAdminOperationsQueryRepository,
    {
      provide: ADMIN_OPERATIONS_QUERY_REPOSITORY,
      useExisting: SqlAdminOperationsQueryRepository,
    },
  ],
})
export class OperationsModule {}

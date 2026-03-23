import { Global, Module } from '@nestjs/common';

import { TRANSACTION_MANAGER } from '../shared/application/transaction-manager';
import { DatabaseService } from './database.service';
import { DatabaseTransactionManager } from './database-transaction-manager';

@Global()
@Module({
  providers: [
    DatabaseService,
    DatabaseTransactionManager,
    {
      provide: TRANSACTION_MANAGER,
      useExisting: DatabaseTransactionManager,
    },
  ],
  exports: [DatabaseService, TRANSACTION_MANAGER],
})
export class DatabaseModule {}

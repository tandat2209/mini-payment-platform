import { Injectable } from '@nestjs/common';

import {
  TransactionContext,
  type TransactionManager,
} from '../shared/application/transaction-manager';
import { type DatabaseQueryable, DatabaseService } from './database.service';

export class DatabaseTransactionContext extends TransactionContext {
  constructor(readonly queryable: DatabaseQueryable) {
    super();
  }
}

@Injectable()
export class DatabaseTransactionManager implements TransactionManager {
  constructor(private readonly databaseService: DatabaseService) {}

  runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return this.databaseService.transaction((queryable) =>
      operation(new DatabaseTransactionContext(queryable)),
    );
  }
}

export function getDatabaseQueryable(context: TransactionContext): DatabaseQueryable {
  if (!(context instanceof DatabaseTransactionContext)) {
    throw new Error('Unsupported transaction context implementation');
  }

  return context.queryable;
}

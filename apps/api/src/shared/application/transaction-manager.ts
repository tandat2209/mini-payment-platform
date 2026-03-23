export abstract class TransactionContext {}

export interface TransactionManager {
  runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T>;
}

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');

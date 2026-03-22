import { Inject, Injectable } from '@nestjs/common';

import { type CurrentCustomer } from '../../../access/customer/current-customer.types';
import {
  TRANSACTION_QUERY_REPOSITORY,
  type TransactionListFilters,
  type TransactionQueryRepository,
} from '../../domain/transaction-query.repository';

@Injectable()
export class GetTransactionsQuery {
  constructor(
    @Inject(TRANSACTION_QUERY_REPOSITORY)
    private readonly transactionQueryRepository: TransactionQueryRepository,
  ) {}

  list(
    customer: CurrentCustomer,
    filters: TransactionListFilters,
  ): ReturnType<TransactionQueryRepository['listTransactions']> {
    return this.transactionQueryRepository.listTransactions(customer.id, filters);
  }

  getDetail(
    customer: CurrentCustomer,
    transactionId: string,
  ): ReturnType<TransactionQueryRepository['getTransactionDetail']> {
    return this.transactionQueryRepository.getTransactionDetail(customer.id, transactionId);
  }
}

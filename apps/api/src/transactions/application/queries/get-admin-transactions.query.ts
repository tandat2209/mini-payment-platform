import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_TRANSACTION_QUERY_REPOSITORY,
  type AdminTransactionListFilters,
  type AdminTransactionQueryRepository,
} from '../../domain/admin-transaction-query.repository';

@Injectable()
export class GetAdminTransactionsQuery {
  constructor(
    @Inject(ADMIN_TRANSACTION_QUERY_REPOSITORY)
    private readonly adminTransactionQueryRepository: AdminTransactionQueryRepository,
  ) {}

  getDetail(
    transactionId: string,
  ): ReturnType<AdminTransactionQueryRepository['getTransactionDetail']> {
    return this.adminTransactionQueryRepository.getTransactionDetail(transactionId);
  }

  list(
    filters: AdminTransactionListFilters,
  ): ReturnType<AdminTransactionQueryRepository['listTransactions']> {
    return this.adminTransactionQueryRepository.listTransactions(filters);
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { type CurrentCustomer } from '../../../access/customer/current-customer.types';
import {
  STATEMENT_QUERY_REPOSITORY,
  type StatementQueryRepository,
} from '../../domain/statement-query.repository';

@Injectable()
export class GetStatementsQuery {
  constructor(
    @Inject(STATEMENT_QUERY_REPOSITORY)
    private readonly statementQueryRepository: StatementQueryRepository,
  ) {}

  listAvailablePeriods(
    customer: CurrentCustomer,
  ): ReturnType<StatementQueryRepository['listAvailableStatementPeriods']> {
    return this.statementQueryRepository.listAvailableStatementPeriods(customer.id);
  }

  getDetail(
    customer: CurrentCustomer,
    walletId: string,
    currency: string,
    year: number,
    month: number,
  ): ReturnType<StatementQueryRepository['getStatementDetail']> {
    return this.statementQueryRepository.getStatementDetail(
      customer.id,
      walletId,
      currency,
      year,
      month,
    );
  }
}

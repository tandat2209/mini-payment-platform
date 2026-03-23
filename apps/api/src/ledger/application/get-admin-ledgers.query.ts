import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_LEDGER_QUERY_REPOSITORY,
  type AdminLedgerListFilters,
  type AdminLedgerQueryRepository,
} from '../domain/admin-ledger-query.repository';

@Injectable()
export class GetAdminLedgersQuery {
  constructor(
    @Inject(ADMIN_LEDGER_QUERY_REPOSITORY)
    private readonly adminLedgerQueryRepository: AdminLedgerQueryRepository,
  ) {}

  getDetail(
    ledgerTransactionId: string,
  ): ReturnType<AdminLedgerQueryRepository['getLedgerTransactionDetail']> {
    return this.adminLedgerQueryRepository.getLedgerTransactionDetail(ledgerTransactionId);
  }

  list(
    filters: AdminLedgerListFilters,
  ): ReturnType<AdminLedgerQueryRepository['listLedgerTransactions']> {
    return this.adminLedgerQueryRepository.listLedgerTransactions(filters);
  }
}

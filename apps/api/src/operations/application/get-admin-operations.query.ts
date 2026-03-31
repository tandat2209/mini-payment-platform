import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_OPERATIONS_QUERY_REPOSITORY,
  type AdminOperationsQueryRepository,
  type AdminReconciliationExceptionView,
  type AdminReconciliationReportBatchView,
  type AdminReconciliationReportLineView,
  type AdminWebhookEventView,
} from '../domain/admin-operations-query.repository';

@Injectable()
export class GetAdminOperationsQuery {
  constructor(
    @Inject(ADMIN_OPERATIONS_QUERY_REPOSITORY)
    private readonly adminOperationsQueryRepository: AdminOperationsQueryRepository,
  ) {}

  async listReconciliationExceptions(): Promise<AdminReconciliationExceptionView[]> {
    return await this.adminOperationsQueryRepository.listReconciliationExceptions();
  }

  async listReconciliationReportBatches(): Promise<AdminReconciliationReportBatchView[]> {
    return await this.adminOperationsQueryRepository.listReconciliationReportBatches();
  }

  async listReconciliationReportLines(): Promise<AdminReconciliationReportLineView[]> {
    return await this.adminOperationsQueryRepository.listReconciliationReportLines();
  }

  async listWebhookEvents(): Promise<AdminWebhookEventView[]> {
    return await this.adminOperationsQueryRepository.listWebhookEvents();
  }
}

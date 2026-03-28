import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_PAYOUT_QUERY_REPOSITORY,
  type AdminPayoutListItemView,
  type AdminPayoutQueryRepository,
} from '../domain/admin-payout-query.repository';

@Injectable()
export class GetAdminPayoutsQuery {
  constructor(
    @Inject(ADMIN_PAYOUT_QUERY_REPOSITORY)
    private readonly adminPayoutQueryRepository: AdminPayoutQueryRepository,
  ) {}

  async list(): Promise<AdminPayoutListItemView[]> {
    return await this.adminPayoutQueryRepository.listPayouts();
  }
}

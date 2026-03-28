import { Inject, Injectable } from '@nestjs/common';

import {
  ADMIN_RECIPIENT_QUERY_REPOSITORY,
  type AdminRecipientListItemView,
  type AdminRecipientQueryRepository,
} from '../../domain/admin-recipient-query.repository';

@Injectable()
export class GetAdminRecipientsQuery {
  constructor(
    @Inject(ADMIN_RECIPIENT_QUERY_REPOSITORY)
    private readonly adminRecipientQueryRepository: AdminRecipientQueryRepository,
  ) {}

  async list(): Promise<AdminRecipientListItemView[]> {
    return await this.adminRecipientQueryRepository.listRecipients();
  }
}

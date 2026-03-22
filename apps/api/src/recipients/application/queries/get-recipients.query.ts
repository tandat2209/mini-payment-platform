import { Inject, Injectable } from '@nestjs/common';

import { type CurrentCustomer } from '../../../access/customer/current-customer.types';
import {
  RECIPIENT_QUERY_REPOSITORY,
  type RecipientQueryRepository,
} from '../../domain/recipient-query.repository';

@Injectable()
export class GetRecipientsQuery {
  constructor(
    @Inject(RECIPIENT_QUERY_REPOSITORY)
    private readonly recipientQueryRepository: RecipientQueryRepository,
  ) {}

  list(customer: CurrentCustomer): ReturnType<RecipientQueryRepository['listRecipients']> {
    return this.recipientQueryRepository.listRecipients(customer.id);
  }

  getDetail(
    customer: CurrentCustomer,
    recipientId: string,
  ): ReturnType<RecipientQueryRepository['getRecipientDetail']> {
    return this.recipientQueryRepository.getRecipientDetail(customer.id, recipientId);
  }
}

import { Module } from '@nestjs/common';

import { GetRecipientsQuery } from './application/queries/get-recipients.query';
import { RECIPIENT_QUERY_REPOSITORY } from './domain/recipient-query.repository';
import { SqlRecipientQueryRepository } from './infrastructure/sql-recipient-query.repository';
import { RecipientsController } from './presentation/customer-api/recipients.controller';

@Module({
  controllers: [RecipientsController],
  providers: [
    GetRecipientsQuery,
    SqlRecipientQueryRepository,
    {
      provide: RECIPIENT_QUERY_REPOSITORY,
      useExisting: SqlRecipientQueryRepository,
    },
  ],
})
export class RecipientsModule {}

import { Module } from '@nestjs/common';

import { GetRecipientsQuery } from './application/queries/get-recipients.query';
import { RecipientOnboardingService } from './application/recipient-onboarding.service';
import { RecipientRailRequirementResolver } from './application/recipient-rail-requirement-resolver.service';
import { RECIPIENT_QUERY_REPOSITORY } from './domain/recipient-query.repository';
import { RECIPIENT_WRITE_REPOSITORY } from './domain/recipient-write.repository';
import { SqlRecipientQueryRepository } from './infrastructure/sql-recipient-query.repository';
import { SqlRecipientWriteRepository } from './infrastructure/sql-recipient-write.repository';
import { RecipientsController } from './presentation/customer-api/recipients.controller';

@Module({
  controllers: [RecipientsController],
  providers: [
    GetRecipientsQuery,
    RecipientRailRequirementResolver,
    RecipientOnboardingService,
    SqlRecipientQueryRepository,
    SqlRecipientWriteRepository,
    {
      provide: RECIPIENT_QUERY_REPOSITORY,
      useExisting: SqlRecipientQueryRepository,
    },
    {
      provide: RECIPIENT_WRITE_REPOSITORY,
      useExisting: SqlRecipientWriteRepository,
    },
  ],
  exports: [RecipientOnboardingService, RecipientRailRequirementResolver],
})
export class RecipientsModule {}

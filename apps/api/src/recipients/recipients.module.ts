import { Module } from '@nestjs/common';

import { GetRecipientsQuery } from './application/queries/get-recipients.query';
import { RecipientOnboardingService } from './application/recipient-onboarding.service';
import { RecipientRailRequirementResolver } from './application/recipient-rail-requirement-resolver.service';
import { RECIPIENT_PROVIDER_REGISTRATION_GATEWAY } from './domain/recipient-provider-registration.gateway';
import { RECIPIENT_QUERY_REPOSITORY } from './domain/recipient-query.repository';
import { RECIPIENT_WRITE_REPOSITORY } from './domain/recipient-write.repository';
import { PspSandboxRecipientProviderRegistrationGateway } from './infrastructure/psp-sandbox-recipient-provider-registration.gateway';
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
    PspSandboxRecipientProviderRegistrationGateway,
    {
      provide: RECIPIENT_QUERY_REPOSITORY,
      useExisting: SqlRecipientQueryRepository,
    },
    {
      provide: RECIPIENT_WRITE_REPOSITORY,
      useExisting: SqlRecipientWriteRepository,
    },
    {
      provide: RECIPIENT_PROVIDER_REGISTRATION_GATEWAY,
      useExisting: PspSandboxRecipientProviderRegistrationGateway,
    },
  ],
  exports: [RecipientOnboardingService, RecipientRailRequirementResolver],
})
export class RecipientsModule {}

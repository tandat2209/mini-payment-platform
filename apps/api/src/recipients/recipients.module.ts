import { Module } from '@nestjs/common';

import { GetAdminRecipientsQuery } from './application/queries/get-admin-recipients.query';
import { GetRecipientsQuery } from './application/queries/get-recipients.query';
import { RecipientOnboardingService } from './application/recipient-onboarding.service';
import { RecipientRailRequirementResolver } from './application/recipient-rail-requirement-resolver.service';
import { ADMIN_RECIPIENT_QUERY_REPOSITORY } from './domain/admin-recipient-query.repository';
import { RECIPIENT_PROVIDER_REGISTRATION_GATEWAY } from './domain/recipient-provider-registration.gateway';
import { RECIPIENT_QUERY_REPOSITORY } from './domain/recipient-query.repository';
import { RECIPIENT_WRITE_REPOSITORY } from './domain/recipient-write.repository';
import { PspSandboxRecipientProviderRegistrationGateway } from './infrastructure/psp-sandbox-recipient-provider-registration.gateway';
import { SqlAdminRecipientQueryRepository } from './infrastructure/sql-admin-recipient-query.repository';
import { SqlRecipientQueryRepository } from './infrastructure/sql-recipient-query.repository';
import { SqlRecipientWriteRepository } from './infrastructure/sql-recipient-write.repository';
import { AdminRecipientsController } from './presentation/admin-api/admin-recipients.controller';
import { RecipientsController } from './presentation/customer-api/recipients.controller';

@Module({
  controllers: [AdminRecipientsController, RecipientsController],
  providers: [
    GetAdminRecipientsQuery,
    GetRecipientsQuery,
    RecipientRailRequirementResolver,
    RecipientOnboardingService,
    SqlAdminRecipientQueryRepository,
    SqlRecipientQueryRepository,
    SqlRecipientWriteRepository,
    PspSandboxRecipientProviderRegistrationGateway,
    {
      provide: ADMIN_RECIPIENT_QUERY_REPOSITORY,
      useExisting: SqlAdminRecipientQueryRepository,
    },
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

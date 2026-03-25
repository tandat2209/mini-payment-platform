import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import {
  type RecipientCapabilityCountryOption,
  type RecipientIdentity,
  RecipientNotFoundError,
  type RecipientRailRecord,
  type RecipientRailRequirementSet,
  RecipientRailValidationError,
} from '../domain/recipient-onboarding.types';
import {
  RECIPIENT_PROVIDER_REGISTRATION_GATEWAY,
  type RecipientProviderRegistrationGateway,
} from '../domain/recipient-provider-registration.gateway';
import {
  RECIPIENT_WRITE_REPOSITORY,
  type RecipientWriteRepository,
} from '../domain/recipient-write.repository';
import { RecipientRailRequirementResolver } from './recipient-rail-requirement-resolver.service';

type RecipientRailInput = {
  countryCode: string;
  currency: string;
  details: Record<string, unknown>;
  isDefault?: boolean;
  rail: string;
};

type RecipientRequirementLookupInput = Pick<
  RecipientRailInput,
  'countryCode' | 'currency' | 'rail'
>;

type CreateRecipientWithRailInput = RecipientRailInput & {
  customerId: string;
  recipientName: string;
};

type AddRecipientRailInput = RecipientRailInput & {
  customerId: string;
  recipientId: string;
};

type RecipientOnboardingResult = {
  recipient: RecipientIdentity;
  rail: RecipientRailRecord;
};

@Injectable()
export class RecipientOnboardingService {
  constructor(
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
    @Inject(RECIPIENT_WRITE_REPOSITORY)
    private readonly recipientWriteRepository: RecipientWriteRepository,
    @Inject(RECIPIENT_PROVIDER_REGISTRATION_GATEWAY)
    private readonly recipientProviderRegistrationGateway: RecipientProviderRegistrationGateway,
    private readonly requirementResolver: RecipientRailRequirementResolver,
  ) {}

  getRequirements(input: RecipientRequirementLookupInput): RecipientRailRequirementSet {
    return this.requirementResolver.resolve(input);
  }

  listCapabilities(input?: {
    countryCode?: string;
    rail?: string;
  }): RecipientCapabilityCountryOption[] {
    const capabilities = this.requirementResolver.listCapabilities();

    return capabilities
      .filter((country) => (input?.countryCode ? country.countryCode === input.countryCode : true))
      .map((country) => ({
        ...country,
        rails: country.rails.filter((rail) => (input?.rail ? rail.rail === input.rail : true)),
      }))
      .filter((country) => country.rails.length > 0);
  }

  async createRecipientWithRail(
    input: CreateRecipientWithRailInput,
  ): Promise<RecipientOnboardingResult> {
    const requirements = this.requirementResolver.resolve(input);
    const now = new Date().toISOString();
    const recipientId = randomUUID();
    const railId = randomUUID();
    const normalizedDetails = normalizeRailDetails(requirements.fields, input.details);

    const created = await this.transactionManager.runInTransaction(async (context) => {
      const recipient = await this.recipientWriteRepository.createRecipient(context, {
        createdAt: now,
        id: recipientId,
        name: input.recipientName.trim(),
        updatedAt: now,
        userId: input.customerId,
      });
      const rail = await this.recipientWriteRepository.createRecipientRail(context, {
        countryCode: requirements.countryCode,
        createdAt: now,
        currency: requirements.currency,
        details: normalizedDetails,
        id: railId,
        isActive: true,
        isDefault: input.isDefault ?? true,
        providerReference: null,
        providerRegisteredAt: null,
        providerRegistrationError: null,
        providerRegistrationStrategy: requirements.providerRegistrationStrategy,
        rail: requirements.rail,
        readinessStatus: requirements.initialReadinessStatus,
        recipientId: recipient.id,
        updatedAt: now,
      });

      return { rail, recipient };
    });

    return {
      rail: await this.finalizeProviderManagedRail(created.recipient.name, created.rail),
      recipient: created.recipient,
    };
  }

  async addRailToRecipient(input: AddRecipientRailInput): Promise<RecipientRailRecord> {
    const requirements = this.requirementResolver.resolve(input);
    const now = new Date().toISOString();
    const railId = randomUUID();
    const normalizedDetails = normalizeRailDetails(requirements.fields, input.details);

    const created = await this.transactionManager.runInTransaction(async (context) => {
      const recipient = await this.recipientWriteRepository.findRecipientOwnedByUser(
        context,
        input.customerId,
        input.recipientId,
      );

      if (!recipient) {
        throw new RecipientNotFoundError(input.recipientId);
      }

      const rail = await this.recipientWriteRepository.createRecipientRail(context, {
        countryCode: requirements.countryCode,
        createdAt: now,
        currency: requirements.currency,
        details: normalizedDetails,
        id: railId,
        isActive: true,
        isDefault: input.isDefault ?? false,
        providerReference: null,
        providerRegisteredAt: null,
        providerRegistrationError: null,
        providerRegistrationStrategy: requirements.providerRegistrationStrategy,
        rail: requirements.rail,
        readinessStatus: requirements.initialReadinessStatus,
        recipientId: recipient.id,
        updatedAt: now,
      });

      return {
        rail,
        recipientName: recipient.name,
      };
    });

    return await this.finalizeProviderManagedRail(created.recipientName, created.rail);
  }

  private async finalizeProviderManagedRail(
    recipientName: string,
    rail: RecipientRailRecord,
  ): Promise<RecipientRailRecord> {
    if (rail.providerRegistrationStrategy !== 'provider_managed') {
      return rail;
    }

    const registrationResult =
      await this.recipientProviderRegistrationGateway.registerRecipientRail({
        countryCode: rail.countryCode,
        currency: rail.currency,
        details: rail.details,
        rail: rail.rail,
        recipientName,
      });

    return await this.transactionManager.runInTransaction(async (context) => {
      const updatedAt = new Date().toISOString();

      if (registrationResult.status === 'active') {
        return await this.recipientWriteRepository.markProviderRegistrationSucceeded(context, {
          providerReference: registrationResult.providerReference,
          providerRegisteredAt: registrationResult.providerRegisteredAt,
          recipientRailId: rail.id,
          updatedAt,
        });
      }

      return await this.recipientWriteRepository.markProviderRegistrationFailed(context, {
        providerRegistrationError: registrationResult.errorMessage,
        recipientRailId: rail.id,
        updatedAt,
      });
    });
  }
}

function normalizeRailDetails(
  fields: Array<{ key: string; kind: string; required: boolean }>,
  details: Record<string, unknown>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  const missingFields: string[] = [];

  for (const field of fields) {
    const rawValue = details[field.key];
    const value = typeof rawValue === 'string' ? normalizeDetailValue(field.kind, rawValue) : '';

    if (!value) {
      if (field.required) {
        missingFields.push(field.key);
      }

      continue;
    }

    normalized[field.key] = value;
  }

  if (missingFields.length > 0) {
    throw new RecipientRailValidationError(missingFields);
  }

  return normalized;
}

function normalizeDetailValue(kind: string, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  switch (kind) {
    case 'iban':
      return trimmed.replace(/\s+/g, '').toUpperCase();
    case 'swift_code':
      return trimmed.replace(/\s+/g, '').toUpperCase();
    default:
      return trimmed;
  }
}

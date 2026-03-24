import assert from 'node:assert/strict';
import test from 'node:test';

import { type TransactionContext } from '../../shared/application/transaction-manager';
import { RecipientRailValidationError } from '../domain/recipient-onboarding.types';
import {
  type CreateRecipientInput,
  type CreateRecipientRailInput,
  type RecipientWriteRepository,
} from '../domain/recipient-write.repository';
import { RecipientOnboardingService } from './recipient-onboarding.service';
import { RecipientRailRequirementResolver } from './recipient-rail-requirement-resolver.service';

class FakeTransactionManager {
  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return await operation({} as TransactionContext);
  }
}

class FakeRecipientWriteRepository implements RecipientWriteRepository {
  readonly recipients: CreateRecipientInput[] = [];
  readonly rails: CreateRecipientRailInput[] = [];

  async createRecipient(_context: TransactionContext, input: CreateRecipientInput) {
    this.recipients.push(input);

    return {
      id: input.id,
      name: input.name,
      status: 'active',
      userId: input.userId,
    };
  }

  async createRecipientRail(_context: TransactionContext, input: CreateRecipientRailInput) {
    this.rails.push(input);

    return {
      countryCode: input.countryCode,
      createdAt: input.createdAt,
      currency: input.currency,
      details: input.details,
      id: input.id,
      isActive: input.isActive,
      isDefault: input.isDefault,
      providerReference: input.providerReference,
      providerRegisteredAt: input.providerRegisteredAt,
      providerRegistrationError: input.providerRegistrationError,
      providerRegistrationStrategy: input.providerRegistrationStrategy,
      rail: input.rail,
      readinessStatus: input.readinessStatus,
      recipientId: input.recipientId,
      updatedAt: input.updatedAt,
    };
  }

  async findRecipientOwnedByUser(
    _context: TransactionContext,
    userId: string,
    recipientId: string,
  ) {
    return {
      id: recipientId,
      name: 'Existing recipient',
      status: 'active',
      userId,
    };
  }
}

test('recipient onboarding creates a recipient with an ACH rail that is immediately active', async () => {
  const repository = new FakeRecipientWriteRepository();
  const service = new RecipientOnboardingService(
    new FakeTransactionManager(),
    repository,
    new RecipientRailRequirementResolver(),
  );

  const result = await service.createRecipientWithRail({
    countryCode: 'us',
    currency: 'usd',
    customerId: '11111111-1111-1111-1111-111111111111',
    details: {
      accountNumber: '9876543210',
      routingNumber: '011000015',
      unsupportedField: 'ignored',
    },
    rail: 'ach',
    recipientName: 'Vendor One',
  });

  assert.equal(result.recipient.name, 'Vendor One');
  assert.equal(repository.recipients.length, 1);
  assert.equal(repository.rails.length, 1);
  assert.equal(repository.rails[0]?.providerRegistrationStrategy, 'platform_managed');
  assert.equal(repository.rails[0]?.readinessStatus, 'active');
  assert.deepEqual(repository.rails[0]?.details, {
    accountNumber: '9876543210',
    routingNumber: '011000015',
  });
});

test('recipient onboarding rejects missing required SWIFT details', async () => {
  const service = new RecipientOnboardingService(
    new FakeTransactionManager(),
    new FakeRecipientWriteRepository(),
    new RecipientRailRequirementResolver(),
  );

  await assert.rejects(
    () =>
      service.createRecipientWithRail({
        countryCode: 'GB',
        currency: 'USD',
        customerId: '11111111-1111-1111-1111-111111111111',
        details: {
          accountNumber: '111122223333',
        },
        rail: 'swift',
        recipientName: 'Vendor Two',
      }),
    (error: unknown) => {
      assert.ok(error instanceof RecipientRailValidationError);
      assert.deepEqual(error.missingFields, ['swiftCode']);

      return true;
    },
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PayoutRecipientRailCurrencyMismatchError,
  PayoutRecipientRailNotReadyError,
  ProviderManagedRecipientRailMissingReferenceError,
} from '../domain/payout-preparation.types';
import type { PayoutRecipientRailRepository } from '../domain/payout-recipient-rail.repository';
import { PreparePayoutIntentService } from './prepare-payout-intent.service';

class InMemoryPayoutRecipientRailRepository implements PayoutRecipientRailRepository {
  constructor(
    private readonly recipientRail: Awaited<
      ReturnType<PayoutRecipientRailRepository['findOwnedRecipientRail']>
    > | null,
  ) {}

  async findOwnedRecipientRail(): Promise<
    Awaited<ReturnType<PayoutRecipientRailRepository['findOwnedRecipientRail']>>
  > {
    return this.recipientRail;
  }
}

test('prepare payout intent uses stored details for platform-managed rails', async () => {
  const service = new PreparePayoutIntentService(
    new InMemoryPayoutRecipientRailRepository({
      currency: 'USD',
      details: {
        accountNumber: '123456789',
        routingNumber: '021000021',
      },
      isActive: true,
      providerReference: null,
      providerRegistrationStrategy: 'platform_managed',
      rail: 'ach',
      readinessStatus: 'active',
      recipientId: 'recipient-1',
      recipientName: 'Alice Nguyen',
      recipientRailId: 'rail-1',
      recipientStatus: 'active',
    }),
  );

  const result = await service.prepare({
    amountMinor: 2500,
    currency: 'usd',
    customerId: 'customer-1',
    recipientRailId: 'rail-1',
    sourceWalletId: 'wallet-1',
  });

  assert.equal(result.currency, 'USD');
  assert.equal(result.recipientRailId, 'rail-1');
  assert.deepEqual(result.submissionTarget, {
    details: {
      accountNumber: '123456789',
      routingNumber: '021000021',
    },
    mode: 'inline_recipient_details',
  });
});

test('prepare payout intent uses provider reference for provider-managed rails', async () => {
  const service = new PreparePayoutIntentService(
    new InMemoryPayoutRecipientRailRepository({
      currency: 'EUR',
      details: {
        iban: 'DE89370400440532013000',
      },
      isActive: true,
      providerReference: 'bene_123',
      providerRegistrationStrategy: 'provider_managed',
      rail: 'sepa',
      readinessStatus: 'active',
      recipientId: 'recipient-1',
      recipientName: 'Alice Nguyen',
      recipientRailId: 'rail-1',
      recipientStatus: 'active',
    }),
  );

  const result = await service.prepare({
    amountMinor: 2500,
    currency: 'EUR',
    customerId: 'customer-1',
    recipientRailId: 'rail-1',
    sourceWalletId: 'wallet-1',
  });

  assert.deepEqual(result.submissionTarget, {
    mode: 'provider_reference',
    providerReference: 'bene_123',
  });
});

test('prepare payout intent rejects rails that are not payout ready', async () => {
  const service = new PreparePayoutIntentService(
    new InMemoryPayoutRecipientRailRepository({
      currency: 'EUR',
      details: {
        iban: 'DE89370400440532013000',
      },
      isActive: true,
      providerReference: null,
      providerRegistrationStrategy: 'provider_managed',
      rail: 'sepa',
      readinessStatus: 'failed',
      recipientId: 'recipient-1',
      recipientName: 'Alice Nguyen',
      recipientRailId: 'rail-1',
      recipientStatus: 'active',
    }),
  );

  await assert.rejects(
    () =>
      service.prepare({
        amountMinor: 2500,
        currency: 'EUR',
        customerId: 'customer-1',
        recipientRailId: 'rail-1',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof PayoutRecipientRailNotReadyError,
  );
});

test('prepare payout intent rejects currency mismatches', async () => {
  const service = new PreparePayoutIntentService(
    new InMemoryPayoutRecipientRailRepository({
      currency: 'EUR',
      details: {
        iban: 'DE89370400440532013000',
      },
      isActive: true,
      providerReference: 'bene_123',
      providerRegistrationStrategy: 'provider_managed',
      rail: 'sepa',
      readinessStatus: 'active',
      recipientId: 'recipient-1',
      recipientName: 'Alice Nguyen',
      recipientRailId: 'rail-1',
      recipientStatus: 'active',
    }),
  );

  await assert.rejects(
    () =>
      service.prepare({
        amountMinor: 2500,
        currency: 'USD',
        customerId: 'customer-1',
        recipientRailId: 'rail-1',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof PayoutRecipientRailCurrencyMismatchError,
  );
});

test('prepare payout intent rejects provider-managed rails missing provider references', async () => {
  const service = new PreparePayoutIntentService(
    new InMemoryPayoutRecipientRailRepository({
      currency: 'EUR',
      details: {
        iban: 'DE89370400440532013000',
      },
      isActive: true,
      providerReference: null,
      providerRegistrationStrategy: 'provider_managed',
      rail: 'sepa',
      readinessStatus: 'active',
      recipientId: 'recipient-1',
      recipientName: 'Alice Nguyen',
      recipientRailId: 'rail-1',
      recipientStatus: 'active',
    }),
  );

  await assert.rejects(
    () =>
      service.prepare({
        amountMinor: 2500,
        currency: 'EUR',
        customerId: 'customer-1',
        recipientRailId: 'rail-1',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof ProviderManagedRecipientRailMissingReferenceError,
  );
});

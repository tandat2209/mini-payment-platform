import assert from 'node:assert/strict';
import test from 'node:test';

import { RecipientRailRequirementResolver } from './recipient-rail-requirement-resolver.service';

test('recipient requirement resolver returns provider-managed SEPA requirements', () => {
  const resolver = new RecipientRailRequirementResolver();

  const result = resolver.resolve({
    countryCode: 'de',
    currency: 'eur',
    rail: 'sepa',
  });

  assert.deepEqual(result, {
    countryCode: 'DE',
    currency: 'EUR',
    fields: [
      {
        key: 'iban',
        kind: 'iban',
        label: 'IBAN',
        required: true,
      },
    ],
    initialReadinessStatus: 'pending_provider_registration',
    providerRegistrationStrategy: 'provider_managed',
    rail: 'sepa',
  });
});

test('recipient requirement resolver rejects unsupported ACH country and currency combinations', () => {
  const resolver = new RecipientRailRequirementResolver();

  assert.throws(
    () =>
      resolver.resolve({
        countryCode: 'DE',
        currency: 'EUR',
        rail: 'ach',
      }),
    /ACH recipient onboarding is only supported/,
  );
});

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
        helpText: 'Provide the beneficiary IBAN without spaces if possible.',
        key: 'iban',
        kind: 'iban',
        label: 'IBAN',
        maxLength: 34,
        minLength: 15,
        pattern: '^[A-Z]{2}[A-Z0-9]{13,32}$',
        placeholder: 'DE89370400440532013000',
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

test('recipient requirement resolver lists supported onboarding capabilities by country', () => {
  const resolver = new RecipientRailRequirementResolver();

  const result = resolver.listCapabilities();
  const unitedStates = result.find((country) => country.countryCode === 'US');
  const germany = result.find((country) => country.countryCode === 'DE');

  assert.deepEqual(unitedStates, {
    countryCode: 'US',
    countryName: 'United States',
    rails: [
      {
        currencies: [{ currency: 'USD' }],
        description: 'US domestic bank rails',
        providerRegistrationStrategy: 'platform_managed',
        rail: 'ach',
      },
      {
        currencies: [{ currency: 'USD' }, { currency: 'EUR' }],
        description: 'Cross-border bank transfer',
        providerRegistrationStrategy: 'provider_managed',
        rail: 'swift',
      },
    ],
  });
  assert.deepEqual(germany, {
    countryCode: 'DE',
    countryName: 'Germany',
    rails: [
      {
        currencies: [{ currency: 'EUR' }],
        description: 'Single euro payments area',
        providerRegistrationStrategy: 'provider_managed',
        rail: 'sepa',
      },
      {
        currencies: [{ currency: 'USD' }, { currency: 'EUR' }],
        description: 'Cross-border bank transfer',
        providerRegistrationStrategy: 'provider_managed',
        rail: 'swift',
      },
    ],
  });
});

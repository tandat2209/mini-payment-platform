import assert from 'node:assert/strict';
import test from 'node:test';

import { BeneficiariesService } from './beneficiaries.service';

test('registerBeneficiary succeeds for valid SEPA beneficiary details', async () => {
  const service = new BeneficiariesService();

  const response = await service.registerBeneficiary({
    countryCode: 'DE',
    currency: 'EUR',
    details: {
      iban: 'DE89370400440532013000',
    },
    rail: 'sepa',
    recipientName: 'Acme Europe GmbH',
  });

  assert.equal(response.status, 'active');
  assert.equal(response.provider, 'psp_sandbox');
  assert.equal(response.rail, 'sepa');
  assert.match(response.beneficiaryId, /^bene_/);
});

test('registerBeneficiary rejects invalid SWIFT beneficiary details', async () => {
  const service = new BeneficiariesService();

  await assert.rejects(
    () =>
      service.registerBeneficiary({
        countryCode: 'GB',
        currency: 'USD',
        details: {
          accountNumber: '111122223333',
          swiftCode: 'BAD',
        },
        rail: 'swift',
        recipientName: 'Global Vendor',
      }),
    /Valid SWIFT\/BIC is required/,
  );
});

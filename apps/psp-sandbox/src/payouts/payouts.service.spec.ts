import assert from 'node:assert/strict';
import test from 'node:test';

import { type DatabaseQueryable } from '../database/database.service';
import { type PayoutActivityRepository } from './payout-activity.repository';
import { PayoutsService } from './payouts.service';
import { type SandboxPayoutRecord } from './payouts.types';

class InMemoryPayoutActivityRepository implements PayoutActivityRepository {
  readonly events: {
    aggregateExternalId: string;
    eventType: 'payout.submitted' | 'payout.updated';
    externalEventId: string;
    payload: Record<string, unknown>;
  }[] = [];

  private readonly payouts = new Map<string, SandboxPayoutRecord>();

  async createSubmittedPayout(
    _database: DatabaseQueryable,
    input: Parameters<PayoutActivityRepository['createSubmittedPayout']>[1],
  ): Promise<void> {
    this.payouts.set(input.externalPayoutId, {
      callbackMode: input.callbackMode,
      externalPayoutId: input.externalPayoutId,
      externalRequestId: input.externalRequestId,
      payoutReference: input.payoutReference,
      simulatedFinalStatus: input.simulatedFinalStatus,
    });
  }

  async findSubmittedPayoutByExternalPayoutId(
    _database: DatabaseQueryable,
    externalPayoutId: string,
  ): Promise<SandboxPayoutRecord | null> {
    return this.payouts.get(externalPayoutId) ?? null;
  }

  async recordPayoutEvent(
    _database: DatabaseQueryable,
    input: Parameters<PayoutActivityRepository['recordPayoutEvent']>[1],
  ): Promise<void> {
    this.events.push({
      aggregateExternalId: input.aggregateExternalId,
      eventType: input.eventType,
      externalEventId: input.externalEventId,
      payload: input.payload,
    });
  }

  async updatePayoutStatus(
    database: DatabaseQueryable,
    input: Parameters<PayoutActivityRepository['updatePayoutStatus']>[1],
  ): Promise<void> {
    void database;
    void input;
  }
}

function createDatabaseServiceDouble(): {
  query: DatabaseQueryable['query'];
  transaction: <T>(callback: (database: DatabaseQueryable) => Promise<T>) => Promise<T>;
} {
  const query: DatabaseQueryable['query'] = async () => {
    throw new Error('query should not be called directly in this test');
  };

  return {
    query,
    async transaction<T>(callback: (database: DatabaseQueryable) => Promise<T>): Promise<T> {
      return await callback({ query });
    },
  };
}

test('submitPayout stores provider identifiers and deterministic sandbox outcome', async () => {
  const repository = new InMemoryPayoutActivityRepository();
  const service = new PayoutsService(createDatabaseServiceDouble() as never, repository);

  const response = await service.submitPayout({
    amountMinor: 12500,
    currency: 'USD',
    payoutReference: 'payout-demo-001',
    recipient: {
      countryCode: 'US',
      name: 'Big City Boi',
      rail: 'ach',
    },
    simulation: {
      finalStatus: 'failed',
    },
    submissionTarget: {
      details: {
        accountNumber: '123456789',
        routingNumber: '021000021',
      },
      mode: 'inline_details',
    },
  });

  assert.equal(response.provider, 'psp_sandbox');
  assert.equal(response.status, 'accepted');
  assert.equal(response.callbackMode, 'manual');
  assert.equal(response.simulatedFinalStatus, 'failed');
  assert.match(response.externalRequestId, /^preq_/);
  assert.match(response.externalPayoutId, /^ppay_/);
  assert.equal(repository.events[0]?.eventType, 'payout.submitted');
});

test('simulatePayoutUpdate posts payout callback payload to the API target', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const repository = new InMemoryPayoutActivityRepository();
    const service = new PayoutsService(createDatabaseServiceDouble() as never, repository);
    const submission = await service.submitPayout({
      amountMinor: 4500,
      currency: 'EUR',
      payoutReference: 'payout-demo-002',
      recipient: {
        countryCode: 'DE',
        name: 'Acme GmbH',
        rail: 'sepa',
      },
      submissionTarget: {
        beneficiaryId: 'bene_123',
        mode: 'provider_beneficiary',
      },
    });

    let requestUrl = '';
    let requestBody: unknown;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          accepted: true,
          status: 'processing',
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const response = await service.simulatePayoutUpdate({
      externalEventId: 'evt_payout_001',
      externalPayoutId: submission.externalPayoutId,
      status: 'processing',
    });

    assert.equal(requestUrl, 'http://api.test/webhooks/payouts');
    assert.equal(response.externalEventId, 'evt_payout_001');
    assert.equal((requestBody as { eventType: string }).eventType, 'payout.updated');
    assert.equal(
      (requestBody as { data: { externalPayoutId: string } }).data.externalPayoutId,
      submission.externalPayoutId,
    );
    assert.equal(
      (requestBody as { data: { externalRequestId: string } }).data.externalRequestId,
      submission.externalRequestId,
    );
    assert.equal(repository.events.at(-1)?.eventType, 'payout.updated');
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
    } else {
      process.env.PSP_SANDBOX_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

test('simulatePayoutUpdate rejects unknown payouts', async () => {
  const repository = new InMemoryPayoutActivityRepository();
  const service = new PayoutsService(createDatabaseServiceDouble() as never, repository);

  await assert.rejects(
    () =>
      service.simulatePayoutUpdate({
        externalPayoutId: 'ppay_missing',
        status: 'paid',
      }),
    /Unknown PSP sandbox payout/,
  );
});

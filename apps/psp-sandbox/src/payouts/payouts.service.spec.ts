import assert from 'node:assert/strict';
import test from 'node:test';

import { type DatabaseQueryable } from '../database/database.service';
import { PayoutsService } from './payouts.service';

function createDatabaseServiceDouble(): {
  query: DatabaseQueryable['query'];
  transaction: <T>(callback: (database: DatabaseQueryable) => Promise<T>) => Promise<T>;
} {
  const query: DatabaseQueryable['query'] = async () => {
    return {
      command: 'SELECT',
      fields: [],
      oid: 0,
      rowCount: 0,
      rows: [],
    } as never;
  };

  return {
    query,
    async transaction<T>(callback: (database: DatabaseQueryable) => Promise<T>): Promise<T> {
      return await callback({ query });
    },
  };
}

function createSubmittedPayoutDatabaseServiceDouble(input: {
  externalPayoutId: string;
  externalRequestId: string;
  payoutReference: string;
}): {
  query: DatabaseQueryable['query'];
  transaction: <T>(callback: (database: DatabaseQueryable) => Promise<T>) => Promise<T>;
} {
  const query: DatabaseQueryable['query'] = async (_sql, parameters = []) => {
    const externalPayoutId = parameters[0];

    if (externalPayoutId !== input.externalPayoutId) {
      return {
        command: 'SELECT',
        fields: [],
        oid: 0,
        rowCount: 0,
        rows: [],
      } as never;
    }

    return {
      command: 'SELECT',
      fields: [],
      oid: 0,
      rowCount: 1,
      rows: [
        {
          external_payout_id: input.externalPayoutId,
          external_request_id: input.externalRequestId,
          payout_reference: input.payoutReference,
        },
      ],
    } as never;
  };

  return {
    query,
    async transaction<T>(callback: (database: DatabaseQueryable) => Promise<T>): Promise<T> {
      return await callback({ query });
    },
  };
}

test('submitPayout stores provider identifiers and deterministic sandbox outcome', async () => {
  const service = new PayoutsService(createDatabaseServiceDouble() as never);

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
});

test('simulatePayoutUpdate posts payout callback payload to the API target', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const submission = {
      externalPayoutId: 'ppay_demo_002',
      externalRequestId: 'preq_demo_002',
      payoutReference: 'payout-demo-002',
    };
    const service = new PayoutsService(
      createSubmittedPayoutDatabaseServiceDouble(submission) as never,
    );

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
  const service = new PayoutsService(createDatabaseServiceDouble() as never);

  await assert.rejects(
    () =>
      service.simulatePayoutUpdate({
        externalPayoutId: 'ppay_missing',
        status: 'paid',
      }),
    /Unknown PSP sandbox payout/,
  );
});

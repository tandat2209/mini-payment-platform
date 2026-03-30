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
  currency?: string;
  externalPayoutId: string;
  externalRequestId: string;
  grossAmountMinor?: number;
  payoutStatus?: string;
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
          currency: input.currency ?? 'USD',
          external_payout_id: input.externalPayoutId,
          external_request_id: input.externalRequestId,
          gross_amount_minor: input.grossAmountMinor ?? 12500,
          payout_status: input.payoutStatus ?? 'paid',
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

test('simulatePayoutReturn posts payout return payload for a previously paid payout', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const submission = {
      currency: 'EUR',
      externalPayoutId: 'ppay_demo_return_001',
      externalRequestId: 'preq_demo_return_001',
      grossAmountMinor: 27200,
      payoutReference: 'payout-return-demo-001',
    };
    const service = new PayoutsService(
      createSubmittedPayoutDatabaseServiceDouble(submission) as never,
    );

    let requestBody: unknown;
    let requestUrl = '';

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          accepted: true,
          status: 'received',
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const response = await service.simulatePayoutReturn({
      externalEventId: 'evt_payout_return_001',
      externalPayoutId: submission.externalPayoutId,
      returnReason: 'destination_bank_returned',
      returnedAmountMinor: 27000,
    });

    assert.equal(requestUrl, 'http://api.test/webhooks/payouts');
    assert.equal(response.externalEventId, 'evt_payout_return_001');
    assert.equal((requestBody as { eventType: string }).eventType, 'payout.returned');
    assert.equal((requestBody as { data: { status: string } }).data.status, 'returned');
    assert.equal(
      (requestBody as { data: { returnedAmountMinor: number } }).data.returnedAmountMinor,
      27000,
    );
    assert.equal((requestBody as { data: { currency: string } }).data.currency, 'EUR');
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
    } else {
      process.env.PSP_SANDBOX_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

test('simulatePayoutReturn supports deterministic replay when the same external event id is reused', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const submission = {
      externalPayoutId: 'ppay_demo_return_002',
      externalRequestId: 'preq_demo_return_002',
      payoutReference: 'payout-return-demo-002',
    };
    const service = new PayoutsService(
      createSubmittedPayoutDatabaseServiceDouble(submission) as never,
    );

    const seenEventIds: string[] = [];

    globalThis.fetch = (async (_input, init) => {
      const requestBody = init?.body ? JSON.parse(String(init.body)) : null;
      seenEventIds.push((requestBody as { externalEventId: string }).externalEventId);

      return new Response(
        JSON.stringify({
          accepted: true,
          status: 'received',
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const first = await service.simulatePayoutReturn({
      externalEventId: 'evt_payout_return_replay_001',
      externalPayoutId: submission.externalPayoutId,
      returnedAmountMinor: 12500,
    });
    const second = await service.simulatePayoutReturn({
      externalEventId: 'evt_payout_return_replay_001',
      externalPayoutId: submission.externalPayoutId,
      returnedAmountMinor: 12500,
    });

    assert.equal(first.externalEventId, 'evt_payout_return_replay_001');
    assert.equal(second.externalEventId, 'evt_payout_return_replay_001');
    assert.deepEqual(seenEventIds, [
      'evt_payout_return_replay_001',
      'evt_payout_return_replay_001',
    ]);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
    } else {
      process.env.PSP_SANDBOX_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

test('simulatePayoutReturn rejects payouts that are not yet paid', async () => {
  const service = new PayoutsService(
    createSubmittedPayoutDatabaseServiceDouble({
      externalPayoutId: 'ppay_processing',
      externalRequestId: 'preq_processing',
      payoutReference: 'payout-processing',
      payoutStatus: 'processing',
    }) as never,
  );

  await assert.rejects(
    () =>
      service.simulatePayoutReturn({
        externalPayoutId: 'ppay_processing',
        returnedAmountMinor: 100,
      }),
    /must be paid before it can be returned/,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { AppService } from './app.service';

test('simulateFundingWebhook reuses an explicit external event id', async () => {
  const originalBaseUrl = process.env.SIMULATOR_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;

  process.env.SIMULATOR_TARGET_API_BASE_URL = 'http://api.test';

  try {
    let requestUrl = '';
    let requestBody: unknown;

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          accepted: true,
          duplicate: false,
          event: {
            eventType: 'funding.completed',
            externalEventId: 'evt_funding_replay',
            id: 'webhook-1',
            processingStatus: 'received',
            provider: 'simulator_psp',
            receivedAt: '2026-03-23T06:00:00.000Z',
          },
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const service = new AppService();
    const response = await service.simulateFundingWebhook({
      amountMinor: 2500,
      currency: 'USD',
      customerExternalRef: 'user_demo_alice',
      externalEventId: 'evt_funding_replay',
      fundingDetailId: 'funding-detail-1',
    });

    assert.equal(requestUrl, 'http://api.test/webhooks/funding');
    assert.equal(response.externalEventId, 'evt_funding_replay');
    assert.equal(
      (requestBody as { externalEventId: string }).externalEventId,
      'evt_funding_replay',
    );
    assert.equal((requestBody as { provider: string }).provider, 'simulator_psp');
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.SIMULATOR_TARGET_API_BASE_URL;
    } else {
      process.env.SIMULATOR_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

test('simulateFundingWebhook generates an external event id when omitted', async () => {
  const originalBaseUrl = process.env.SIMULATOR_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;

  process.env.SIMULATOR_TARGET_API_BASE_URL = 'http://api.test';

  try {
    let requestBody: unknown;

    globalThis.fetch = (async (_input, init) => {
      requestBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          accepted: true,
          duplicate: false,
          event: {
            eventType: 'funding.completed',
            externalEventId: (requestBody as { externalEventId: string }).externalEventId,
            id: 'webhook-2',
            processingStatus: 'received',
            provider: 'simulator_psp',
            receivedAt: '2026-03-23T06:05:00.000Z',
          },
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const service = new AppService();
    const response = await service.simulateFundingWebhook({
      amountMinor: 4200,
      currency: 'EUR',
      customerExternalRef: 'user_demo_alice',
      fundingDetailId: 'funding-detail-2',
    });

    assert.match(response.externalEventId, /^evt_funding_/);
    assert.match((requestBody as { externalEventId: string }).externalEventId, /^evt_funding_/);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.SIMULATOR_TARGET_API_BASE_URL;
    } else {
      process.env.SIMULATOR_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

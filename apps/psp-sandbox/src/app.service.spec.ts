import assert from 'node:assert/strict';
import test from 'node:test';

import { AppService } from './app.service';

test('simulateFundingWebhook reuses an explicit external event id', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;

  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

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
            provider: 'psp_sandbox',
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
      description: 'March top up',
      destinationIdentifier: '1234567890',
      destinationType: 'account_number',
      externalEventId: 'evt_funding_replay',
      providerReference: 'bank-ref-001',
      sender: {
        accountIdentifier: '99887766',
        bankCode: 'VCB',
        bankName: 'Vietcombank',
        name: 'Alice Nguyen',
      },
    });

    assert.equal(requestUrl, 'http://api.test/webhooks/funding');
    assert.equal(response.externalEventId, 'evt_funding_replay');
    assert.equal(
      (requestBody as { externalEventId: string }).externalEventId,
      'evt_funding_replay',
    );
    assert.equal((requestBody as { provider: string }).provider, 'psp_sandbox');
    assert.equal(
      (requestBody as { data: { description: string } }).data.description,
      'March top up',
    );
    assert.equal(
      (requestBody as { data: { providerReference: string } }).data.providerReference,
      'bank-ref-001',
    );
    assert.equal(
      (requestBody as { data: { sender: { name: string } } }).data.sender.name,
      'Alice Nguyen',
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

test('simulateFundingWebhook generates an external event id when omitted', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;

  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

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
            provider: 'psp_sandbox',
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
      destinationIdentifier: 'DE89370400440532013000',
      destinationType: 'iban',
    });

    assert.match(response.externalEventId, /^evt_funding_/);
    assert.match((requestBody as { externalEventId: string }).externalEventId, /^evt_funding_/);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
    } else {
      process.env.PSP_SANDBOX_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

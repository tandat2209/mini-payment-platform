import assert from 'node:assert/strict';
import test from 'node:test';

import { type DatabaseQueryable } from '../database/database.service';
import { ReconciliationService } from './reconciliation.service';

function createDatabaseServiceDouble(): {
  query: DatabaseQueryable['query'];
  transaction: <T>(callback: (database: DatabaseQueryable) => Promise<T>) => Promise<T>;
} {
  const query: DatabaseQueryable['query'] = async (sql) => {
    if (sql.includes("we.event_type = 'funding.completed'")) {
      return {
        command: 'SELECT',
        fields: [],
        oid: 0,
        rowCount: 1,
        rows: [
          {
            currency: 'USD',
            customer_external_ref: 'user_demo_alice',
            external_event_id: 'evt_funding_demo_001',
            fee_amount_minor: '0',
            gross_amount_minor: '2500',
            internal_reference: 'funding-evt_funding_demo_001',
            net_amount_minor: '2500',
            occurred_at: '2026-03-28T08:15:00.000Z',
            provider_reference: 'bank-ref-001',
            transaction_id: 'txn_funding_demo_001',
            wallet_id: 'wallet_demo_usd_001',
          },
        ],
      } as never;
    }

    if (sql.includes("p.status IN ('submitted', 'processing', 'paid', 'failed')")) {
      return {
        command: 'SELECT',
        fields: [],
        oid: 0,
        rowCount: 1,
        rows: [
          {
            currency: 'USD',
            customer_external_ref: 'user_demo_alice',
            event_timestamp: '2026-03-28T12:00:00.000Z',
            external_payout_id: 'ppay_demo_001',
            external_request_id: 'preq_demo_001',
            fee_amount_minor: '3',
            gross_amount_minor: '2503',
            internal_reference: 'Invoice 208',
            net_amount_minor: '2500',
            payout_id: 'payout_demo_001',
            recipient_name: 'Big City Boi',
            status: 'paid',
            wallet_id: 'wallet_demo_usd_001',
          },
        ],
      } as never;
    }

    if (sql.includes("p.status = 'returned'")) {
      return {
        command: 'SELECT',
        fields: [],
        oid: 0,
        rowCount: 1,
        rows: [
          {
            currency: 'USD',
            customer_external_ref: 'user_demo_alice',
            external_payout_id: 'ppay_demo_001',
            external_request_id: 'preq_demo_001',
            fee_amount_minor: '3',
            gross_amount_minor: '2503',
            internal_reference: 'Invoice 208',
            net_amount_minor: '2500',
            payout_id: 'payout_demo_001',
            returned_amount_minor: '2500',
            returned_at: '2026-03-28T18:30:00.000Z',
            wallet_id: 'wallet_demo_usd_001',
          },
        ],
      } as never;
    }

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

test('simulateDailyReport posts a reconciliation report batch with funding, payout, and return lines', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const service = new ReconciliationService(createDatabaseServiceDouble() as never);
    let requestBody: unknown;
    let requestUrl = '';

    globalThis.fetch = (async (input, init) => {
      requestUrl = String(input);
      requestBody = init?.body ? JSON.parse(String(init.body)) : null;

      return new Response(
        JSON.stringify({
          duplicate: false,
          accepted: true,
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    const response = await service.simulateDailyReport({
      externalEventId: 'evt_reconciliation_20260328',
      providerReportId: 'rpt_20260328_psp_sandbox',
      reportDate: '2026-03-28',
    });

    assert.equal(requestUrl, 'http://api.test/webhooks/reconciliation-reports');
    assert.equal(response.externalEventId, 'evt_reconciliation_20260328');
    assert.equal(
      (requestBody as { eventType: string }).eventType,
      'reconciliation.report.generated',
    );
    assert.equal(
      (requestBody as { data: { lines: Array<{ lineType: string }> } }).data.lines.length,
      3,
    );
    assert.deepEqual(
      (requestBody as { data: { lines: Array<{ lineType: string }> } }).data.lines.map(
        (line) => line.lineType,
      ),
      ['funding', 'payout', 'return'],
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

test('simulateDailyReport supports deterministic replay when the same identifiers are reused', async () => {
  const originalBaseUrl = process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.PSP_SANDBOX_TARGET_API_BASE_URL = 'http://api.test';

  try {
    const service = new ReconciliationService(createDatabaseServiceDouble() as never);
    const payloads: Array<Record<string, unknown>> = [];

    globalThis.fetch = (async (_input, init) => {
      payloads.push(init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {});

      return new Response(
        JSON.stringify({
          duplicate: payloads.length > 1,
          accepted: true,
        }),
        {
          headers: {
            'content-type': 'application/json',
          },
          status: 202,
        },
      );
    }) as typeof fetch;

    await service.simulateDailyReport({
      externalEventId: 'evt_reconciliation_replay_001',
      providerReportId: 'rpt_20260328_psp_sandbox',
      reportDate: '2026-03-28',
    });
    await service.simulateDailyReport({
      externalEventId: 'evt_reconciliation_replay_001',
      providerReportId: 'rpt_20260328_psp_sandbox',
      reportDate: '2026-03-28',
    });

    assert.equal(payloads.length, 2);
    assert.equal(payloads[0]?.externalEventId, payloads[1]?.externalEventId);
    assert.deepEqual(payloads[0]?.data, payloads[1]?.data);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.PSP_SANDBOX_TARGET_API_BASE_URL;
    } else {
      process.env.PSP_SANDBOX_TARGET_API_BASE_URL = originalBaseUrl;
    }
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { configureApp } from './app.factory';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';

type QueryResponseRow = Record<string, unknown>;

class ApiFakeDatabaseService {
  private readonly webhookEvents = new Map<string, QueryResponseRow>();

  async getHealth() {
    return {
      configured: true as const,
      database: 'test',
      status: 'ok' as const,
    };
  }

  async query<T extends QueryResponseRow = QueryResponseRow>(
    sql: string,
    parameters: readonly unknown[] = [],
  ) {
    const withRows = (rows: QueryResponseRow[]) => ({
      rows: rows as unknown as T[],
    });

    if (sql.includes('FROM users')) {
      const identifier = parameters[0];

      if (identifier === 'user_demo_alice') {
        return withRows([{ external_ref: 'user_demo_alice', id: 'alice-id' }]);
      }

      if (identifier === 'user_demo_bob') {
        return withRows([{ external_ref: 'user_demo_bob', id: 'bob-id' }]);
      }

      if (identifier === 'user_demo_charlie') {
        return withRows([{ external_ref: 'user_demo_charlie', id: 'charlie-id' }]);
      }

      return withRows([]);
    }

    if (sql.includes('FROM wallets w') && sql.includes('wallet_balances')) {
      const customerId = parameters[0];

      if (customerId === 'alice-id') {
        return withRows([
          {
            available_amount_minor: '9800',
            currency: 'USD',
            pending_amount_minor: '0',
            updated_at: '2026-03-22T01:20:00.000Z',
            wallet_id: 'wallet-alice',
            wallet_status: 'active',
          },
        ]);
      }

      if (customerId === 'bob-id') {
        return withRows([
          {
            available_amount_minor: '0',
            currency: 'USD',
            pending_amount_minor: '0',
            updated_at: '2026-03-22T00:10:00.000Z',
            wallet_id: 'wallet-bob',
            wallet_status: 'active',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('INSERT INTO webhook_events')) {
      const [id, provider, externalEventId, eventType, payload, receivedAt] = parameters;
      const lookupKey = `${String(provider)}:${String(externalEventId)}`;

      if (this.webhookEvents.has(lookupKey)) {
        return withRows([]);
      }

      const row = {
        event_type: String(eventType),
        external_event_id: String(externalEventId),
        id: String(id),
        payload,
        processing_status: 'received',
        provider: String(provider),
        received_at: String(receivedAt),
      };

      this.webhookEvents.set(lookupKey, row);

      return withRows([row]);
    }

    if (sql.includes('FROM webhook_events') && sql.includes('external_event_id = $2')) {
      const [provider, externalEventId] = parameters;
      const row = this.webhookEvents.get(`${String(provider)}:${String(externalEventId)}`);

      return withRows(row ? [row] : []);
    }

    if (sql.includes('FROM wallets w') && sql.includes('wallet_funding_details')) {
      const customerId = parameters[0];

      if (customerId === 'alice-id') {
        return withRows([
          {
            funding_detail_currency: 'USD',
            funding_detail_details: {
              accountNumber: '1234567890',
              routingNumber: '021000021',
            },
            funding_detail_id: 'funding-detail-usd',
            funding_detail_rail: 'bank_transfer',
            funding_detail_updated_at: '2026-03-22T01:00:00.000Z',
            wallet_id: 'wallet-alice',
            wallet_status: 'active',
          },
          {
            funding_detail_currency: 'EUR',
            funding_detail_details: {
              iban: 'DE89370400440532013000',
            },
            funding_detail_id: 'funding-detail-eur',
            funding_detail_rail: 'virtual_iban',
            funding_detail_updated_at: '2026-03-22T01:05:00.000Z',
            wallet_id: 'wallet-alice',
            wallet_status: 'active',
          },
        ]);
      }

      if (customerId === 'bob-id') {
        return withRows([
          {
            funding_detail_currency: null,
            funding_detail_details: null,
            funding_detail_id: null,
            funding_detail_rail: null,
            funding_detail_updated_at: null,
            wallet_id: 'wallet-bob',
            wallet_status: 'active',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('LEFT JOIN payouts p') && sql.includes('WHERE ut.user_id = $1')) {
      const [customerId, transactionId] = parameters;

      if (customerId === 'alice-id' && transactionId === 'txn-alice') {
        return withRows([
          {
            currency: 'USD',
            description: 'Payout to Vendor One',
            direction: 'debit',
            fee_amount_minor: '3000',
            gross_amount_minor: '3200',
            id: 'txn-alice',
            net_amount_minor: '200',
            occurred_at: '2026-03-22T01:20:00.000Z',
            payout_id: 'payout-1',
            payout_reference: 'payout-001',
            posted_at: '2026-03-22T01:21:20.000Z',
            recipient_id: 'recipient-alice',
            recipient_name: 'Vendor One',
            reference: 'payout-001',
            status: 'completed',
            type: 'payout',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('FROM recipients') && sql.includes('AND id = $2')) {
      const [customerId, recipientId] = parameters;

      if (customerId === 'alice-id' && recipientId === 'recipient-alice') {
        return withRows([
          {
            created_at: '2026-03-22T01:15:00.000Z',
            id: 'recipient-alice',
            name: 'Vendor One',
            status: 'active',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('FROM recipient_rails') && sql.includes('recipient_id = $1')) {
      const [recipientId] = parameters;

      if (recipientId === 'recipient-alice') {
        return withRows([
          {
            currency: 'USD',
            details: {
              accountNumber: '9876543210',
              routingNumber: '011000015',
            },
            id: 'rail-1',
            is_default: true,
            rail: 'ach',
            recipient_id: 'recipient-alice',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('FROM wallets') && sql.includes("status = 'active'")) {
      const [customerId, walletId] = parameters;

      if (customerId === 'alice-id' && walletId === 'wallet-alice') {
        return withRows([{ id: 'wallet-alice' }]);
      }

      if (customerId === 'alice-id' && parameters.length === 1) {
        return withRows([{ id: 'wallet-alice' }]);
      }

      if (customerId === 'bob-id' && parameters.length === 1) {
        return withRows([{ id: 'wallet-bob' }]);
      }

      return withRows([]);
    }

    if (sql.includes('EXTRACT(YEAR FROM COALESCE(ut.posted_at, ut.occurred_at))')) {
      const [customerId, walletId] = parameters;

      if (customerId === 'alice-id' && walletId === 'wallet-alice') {
        return withRows([
          {
            currency: 'USD',
            month: '3',
            wallet_id: 'wallet-alice',
            year: '2026',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('COALESCE(ut.posted_at, ut.occurred_at) >= $4::timestamptz')) {
      return withRows([]);
    }

    if (sql.includes('SUM(') && sql.includes('opening_balance_minor')) {
      return withRows([]);
    }

    if (sql.includes('FROM recipients') && sql.includes('WHERE user_id = $1')) {
      const [customerId] = parameters;

      if (customerId === 'alice-id') {
        return withRows([
          {
            created_at: '2026-03-22T01:15:00.000Z',
            id: 'recipient-alice',
            name: 'Vendor One',
            status: 'active',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('recipient_id = ANY')) {
      const [recipientIds] = parameters as [string[]];

      if (recipientIds.includes('recipient-alice')) {
        return withRows([
          {
            currency: 'USD',
            details: {},
            id: 'rail-1',
            is_default: true,
            rail: 'ach',
            recipient_id: 'recipient-alice',
          },
        ]);
      }

      return withRows([]);
    }

    throw new Error(`Unhandled SQL in API fake database: ${sql}`);
  }

  async transaction<T>(callback: (database: this) => Promise<T>) {
    return await callback(this);
  }
}

async function createTestApp() {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DatabaseService)
    .useValue(new ApiFakeDatabaseService())
    .compile();

  const app = configureApp(testingModule.createNestApplication());

  await app.init();

  return app;
}

async function fetchJson(app: INestApplication, path: string, customerExternalRef: string) {
  const port = await ensureListening(app);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    headers: {
      'x-customer-external-ref': customerExternalRef,
    },
  });

  return {
    body: (await response.json()) as Record<string, unknown>,
    status: response.status,
  };
}

async function ensureListening(app: INestApplication): Promise<number> {
  const server = app.getHttpServer() as {
    address: () => { port: number } | null;
  };
  const address = server.address();

  if (address?.port) {
    return address.port;
  }

  await app.listen(0);

  return (server.address() as { port: number }).port;
}

test('balance API remains customer scoped', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(app, '/customers/me/balances', 'user_demo_bob');

    assert.equal(response.status, 200);
    assert.equal((response.body.wallet as { id: string }).id, 'wallet-bob');
  } finally {
    await app.close();
  }
});

test('transaction detail returns not found for another customer', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(app, '/customers/me/transactions/txn-alice', 'user_demo_bob');

    assert.equal(response.status, 404);
  } finally {
    await app.close();
  }
});

test('statement detail returns not found for another customer wallet', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(
      app,
      '/customers/me/statements/wallet-alice/USD/2026/3',
      'user_demo_bob',
    );

    assert.equal(response.status, 404);
  } finally {
    await app.close();
  }
});

test('recipient detail returns not found for another customer', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(
      app,
      '/customers/me/recipients/recipient-alice',
      'user_demo_bob',
    );

    assert.equal(response.status, 404);
  } finally {
    await app.close();
  }
});

test('funding details API returns active funding details for the current customer', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(app, '/customers/me/funding-details', 'user_demo_alice');

    assert.equal(response.status, 200);
    assert.equal((response.body.wallet as { id: string }).id, 'wallet-alice');
    assert.deepEqual(
      (response.body.fundingDetails as Array<{ id: string }>).map((detail) => detail.id),
      ['funding-detail-usd', 'funding-detail-eur'],
    );
  } finally {
    await app.close();
  }
});

test('funding details API returns an empty collection when the active wallet has no active details', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(app, '/customers/me/funding-details', 'user_demo_bob');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.fundingDetails, []);
    assert.equal((response.body.wallet as { id: string }).id, 'wallet-bob');
  } finally {
    await app.close();
  }
});

test('funding details API returns not found when the customer has no active wallet', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(app, '/customers/me/funding-details', 'user_demo_charlie');

    assert.equal(response.status, 404);
  } finally {
    await app.close();
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { configureApp } from './app.factory';
import { AppModule } from './app.module';
import { DatabaseService } from './database/database.service';
import { RECIPIENT_PROVIDER_REGISTRATION_GATEWAY } from './recipients/domain/recipient-provider-registration.gateway';

type QueryResponseRow = Record<string, unknown>;

const PAYOUT_TEST_RECIPIENT_RAIL_ID = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const PAYOUT_TEST_WALLET_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

class ApiFakeDatabaseService {
  private readonly webhookEvents = new Map<string, QueryResponseRow>();
  private readonly ledgerAccounts: QueryResponseRow[] = [];
  private readonly recipients: QueryResponseRow[] = [
    {
      created_at: '2026-03-22T01:15:00.000Z',
      id: 'recipient-alice',
      name: 'Vendor One',
      status: 'active',
      updated_at: '2026-03-22T01:15:00.000Z',
      user_id: 'alice-id',
    },
  ];
  private readonly recipientRails: QueryResponseRow[] = [
    {
      country_code: 'US',
      created_at: '2026-03-22T01:15:00.000Z',
      currency: 'USD',
      details: {
        accountNumber: '9876543210',
        routingNumber: '011000015',
      },
      id: 'rail-1',
      is_active: true,
      is_default: true,
      provider_reference: null,
      provider_registered_at: null,
      provider_registration_error: null,
      provider_registration_strategy: 'platform_managed',
      rail: 'ach',
      readiness_status: 'active',
      recipient_id: 'recipient-alice',
      updated_at: '2026-03-22T01:15:00.000Z',
    },
  ];
  private readonly walletBalances: QueryResponseRow[] = [
    {
      available_amount_minor: '9800',
      currency: 'USD',
      updated_at: '2026-03-22T01:20:00.000Z',
      wallet_id: 'wallet-alice',
    },
    {
      available_amount_minor: '0',
      currency: 'USD',
      updated_at: '2026-03-22T00:10:00.000Z',
      wallet_id: 'wallet-bob',
    },
  ];

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
      rowCount: rows.length,
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

    if (
      sql.includes('SELECT') &&
      sql.includes('FROM wallets w') &&
      sql.includes('wallet_balances') &&
      sql.includes('wb.currency = $3')
    ) {
      const [customerId, walletId, currency] = parameters;

      if (
        customerId === 'alice-id' &&
        (walletId === 'wallet-alice' || walletId === PAYOUT_TEST_WALLET_ID) &&
        currency === 'USD'
      ) {
        return withRows([
          {
            available_amount_minor:
              this.walletBalances.find(
                (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'USD',
              )?.available_amount_minor ?? '0',
            wallet_id: 'wallet-alice',
          },
        ]);
      }

      return withRows([]);
    }

    if (sql.includes('FROM wallets w') && sql.includes('wallet_balances')) {
      const customerId = parameters[0];

      if (customerId === 'alice-id') {
        return withRows([
          {
            available_amount_minor:
              this.walletBalances.find(
                (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'USD',
              )?.available_amount_minor ?? '0',
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

    if (
      sql.includes('UPDATE wallet_balances') &&
      sql.includes('available_amount_minor = available_amount_minor - $3')
    ) {
      const [walletId, currency, amountMinor, updatedAt] = parameters;
      const balance = this.walletBalances.find(
        (item) =>
          (item.wallet_id === walletId ||
            (walletId === PAYOUT_TEST_WALLET_ID && item.wallet_id === 'wallet-alice')) &&
          item.currency === currency,
      );

      if (!balance) {
        return withRows([]);
      }

      const currentAmount = Number(balance.available_amount_minor);

      if (currentAmount < Number(amountMinor)) {
        return withRows([]);
      }

      balance.available_amount_minor = String(currentAmount - Number(amountMinor));
      balance.updated_at = String(updatedAt);

      return withRows([balance]);
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

    if (
      sql.includes('FROM recipient_rails rr') &&
      sql.includes('INNER JOIN recipients r') &&
      sql.includes('rr.id = $1::uuid')
    ) {
      const [recipientRailId, customerId] = parameters;
      const rail = this.recipientRails.find(
        (item) =>
          item.id === recipientRailId ||
          (recipientRailId === PAYOUT_TEST_RECIPIENT_RAIL_ID && item.id === 'rail-1'),
      );
      const recipient = this.recipients.find((item) => item.id === rail?.recipient_id);

      if (!rail || !recipient || recipient.user_id !== customerId) {
        return withRows([]);
      }

      return withRows([
        {
          currency: rail.currency,
          details: rail.details,
          is_active: rail.is_active,
          provider_reference: rail.provider_reference,
          provider_registration_strategy: rail.provider_registration_strategy,
          rail: rail.rail,
          readiness_status: rail.readiness_status,
          recipient_id: recipient.id,
          recipient_name: recipient.name,
          recipient_rail_id: rail.id,
          recipient_status: recipient.status,
        },
      ]);
    }

    if (sql.includes('FROM recipients') && sql.includes('AND id = $2')) {
      const [customerId, recipientId] = parameters;

      return withRows(
        this.recipients.filter(
          (recipient) => recipient.user_id === customerId && recipient.id === recipientId,
        ),
      );
    }

    if (sql.includes('WHERE id = $1::uuid') && sql.includes('AND user_id = $2::uuid')) {
      const [recipientId, customerId] = parameters;

      return withRows(
        this.recipients.filter(
          (recipient) => recipient.user_id === customerId && recipient.id === recipientId,
        ),
      );
    }

    if (sql.includes('FROM recipient_rails') && sql.includes('recipient_id = $1')) {
      const [recipientId] = parameters;

      return withRows(
        this.recipientRails.filter(
          (rail) => rail.recipient_id === recipientId && rail.is_active === true,
        ),
      );
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes("owner_type = 'wallet'")) {
      const [walletId, currency] = parameters;

      return withRows(
        this.ledgerAccounts.filter(
          (account) =>
            account.owner_type === 'wallet' &&
            account.owner_id === walletId &&
            account.currency === currency &&
            account.account_type === 'liability' &&
            account.status === 'open',
        ),
      );
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes("owner_type = 'recipient'")) {
      const [recipientId, currency] = parameters;

      return withRows(
        this.ledgerAccounts.filter(
          (account) =>
            account.owner_type === 'recipient' &&
            account.owner_id === recipientId &&
            account.currency === currency &&
            account.account_type === 'liability' &&
            account.status === 'open',
        ),
      );
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes("account_type = 'asset'")) {
      const [currency] = parameters;

      return withRows(
        this.ledgerAccounts.filter(
          (account) =>
            account.owner_type === 'platform' &&
            account.owner_id === null &&
            account.currency === currency &&
            account.account_type === 'asset' &&
            account.status === 'open',
        ),
      );
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes("account_type = 'revenue'")) {
      const [currency] = parameters;

      return withRows(
        this.ledgerAccounts.filter(
          (account) =>
            account.owner_type === 'platform' &&
            account.owner_id === null &&
            account.currency === currency &&
            account.account_type === 'revenue' &&
            account.status === 'open',
        ),
      );
    }

    if (sql.includes('INSERT INTO ledger_accounts')) {
      const [id, code, name, ownerIdOrCurrency, maybeCurrency, maybeNow] = parameters;
      const isWalletAccount = sql.includes("'wallet'");
      const isRecipientAccount = sql.includes("'recipient'");
      const isAssetAccount = sql.includes("'asset'");
      const isRevenueAccount = sql.includes("'revenue'");
      const row = {
        account_type: isAssetAccount ? 'asset' : isRevenueAccount ? 'revenue' : 'liability',
        code: String(code),
        created_at: String(isWalletAccount || isRecipientAccount ? maybeNow : maybeCurrency),
        currency: String(isWalletAccount || isRecipientAccount ? maybeCurrency : ownerIdOrCurrency),
        id: String(id),
        name: String(name),
        owner_id: isWalletAccount || isRecipientAccount ? String(ownerIdOrCurrency) : null,
        owner_type: isWalletAccount ? 'wallet' : isRecipientAccount ? 'recipient' : 'platform',
        status: 'open',
        updated_at: String(isWalletAccount || isRecipientAccount ? maybeNow : maybeCurrency),
      };

      this.ledgerAccounts.push(row);

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

      return withRows(this.recipients.filter((recipient) => recipient.user_id === customerId));
    }

    if (sql.includes('recipient_id = ANY')) {
      const [recipientIds] = parameters as [string[]];

      return withRows(
        this.recipientRails.filter(
          (rail) => recipientIds.includes(String(rail.recipient_id)) && rail.is_active === true,
        ),
      );
    }

    if (
      sql.includes('INSERT INTO recipients') &&
      sql.includes('RETURNING id, user_id, name, status')
    ) {
      const [id, userId, name, createdAt, updatedAt] = parameters;
      const row = {
        created_at: String(createdAt),
        id: String(id),
        name: String(name),
        status: 'active',
        updated_at: String(updatedAt),
        user_id: String(userId),
      };

      this.recipients.push(row);

      return withRows([row]);
    }

    if (
      sql.includes('INSERT INTO recipient_rails') &&
      sql.includes('provider_registration_strategy')
    ) {
      const [
        id,
        recipientId,
        rail,
        currency,
        countryCode,
        details,
        readinessStatus,
        providerRegistrationStrategy,
        providerReference,
        providerRegistrationError,
        providerRegisteredAt,
        isDefault,
        isActive,
        createdAt,
        updatedAt,
      ] = parameters;
      const row = {
        country_code: String(countryCode),
        created_at: String(createdAt),
        currency: String(currency),
        details: JSON.parse(String(details)),
        id: String(id),
        is_active: Boolean(isActive),
        is_default: Boolean(isDefault),
        provider_reference: providerReference ? String(providerReference) : null,
        provider_registered_at: providerRegisteredAt ? String(providerRegisteredAt) : null,
        provider_registration_error: providerRegistrationError
          ? String(providerRegistrationError)
          : null,
        provider_registration_strategy: String(providerRegistrationStrategy),
        rail: String(rail),
        readiness_status: String(readinessStatus),
        recipient_id: String(recipientId),
        updated_at: String(updatedAt),
      };

      this.recipientRails.push(row);

      return withRows([row]);
    }

    if (sql.includes('UPDATE recipient_rails') && sql.includes("readiness_status = 'active'")) {
      const [recipientRailId, providerReference, providerRegisteredAt, updatedAt] = parameters;
      const rail = this.recipientRails.find((item) => item.id === recipientRailId);

      if (!rail) {
        return withRows([]);
      }

      rail.provider_reference = String(providerReference);
      rail.provider_registered_at = String(providerRegisteredAt);
      rail.provider_registration_error = null;
      rail.readiness_status = 'active';
      rail.updated_at = String(updatedAt);

      return withRows([rail]);
    }

    if (sql.includes('UPDATE recipient_rails') && sql.includes("readiness_status = 'failed'")) {
      const [recipientRailId, providerRegistrationError, updatedAt] = parameters;
      const rail = this.recipientRails.find((item) => item.id === recipientRailId);

      if (!rail) {
        return withRows([]);
      }

      rail.provider_reference = null;
      rail.provider_registered_at = null;
      rail.provider_registration_error = String(providerRegistrationError);
      rail.readiness_status = 'failed';
      rail.updated_at = String(updatedAt);

      return withRows([rail]);
    }

    if (sql.includes('INSERT INTO user_transactions') && sql.includes("'payout'")) {
      return withRows([]);
    }

    if (sql.includes('INSERT INTO payouts')) {
      return withRows([]);
    }

    if (sql.includes('INSERT INTO ledger_transactions')) {
      return withRows([]);
    }

    if (sql.includes('INSERT INTO ledger_entries')) {
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
    .overrideProvider(RECIPIENT_PROVIDER_REGISTRATION_GATEWAY)
    .useValue({
      async registerRecipientRail() {
        return {
          providerReference: 'bene_swift_test',
          providerRegisteredAt: '2026-03-24T09:30:00.000Z',
          status: 'active' as const,
        };
      },
    })
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

async function postJson(
  app: INestApplication,
  path: string,
  customerExternalRef: string,
  body: Record<string, unknown>,
) {
  const port = await ensureListening(app);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-customer-external-ref': customerExternalRef,
    },
    method: 'POST',
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

test('recipient requirements API returns SEPA requirements for supported country and currency', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(
      app,
      '/customers/me/recipients/requirements?rail=sepa&countryCode=DE&currency=EUR',
      'user_demo_alice',
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.providerRegistrationStrategy, 'provider_managed');
    assert.deepEqual(response.body.fields, [
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
    ]);
  } finally {
    await app.close();
  }
});

test('recipient capabilities API returns backend-owned onboarding options', async () => {
  const app = await createTestApp();

  try {
    const response = await fetchJson(
      app,
      '/customers/me/recipients/capabilities?countryCode=US',
      'user_demo_alice',
    );

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
      items: [
        {
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
        },
      ],
    });
  } finally {
    await app.close();
  }
});

test('recipient create API creates a provider-managed SWIFT rail', async () => {
  const app = await createTestApp();

  try {
    const response = await postJson(app, '/customers/me/recipients', 'user_demo_alice', {
      name: 'Global Vendor',
      rail: {
        countryCode: 'GB',
        currency: 'USD',
        details: {
          accountNumber: '111122223333',
          swiftCode: 'BARCGB22',
        },
        rail: 'swift',
      },
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.name, 'Global Vendor');
    assert.equal(
      (response.body.rails as Array<Record<string, unknown>>)[0]?.providerRegistrationStrategy,
      'provider_managed',
    );
    assert.equal(
      (response.body.rails as Array<Record<string, unknown>>)[0]?.readinessStatus,
      'active',
    );
  } finally {
    await app.close();
  }
});

test('payout create API books a payout request and reduces the visible wallet balance', async () => {
  const app = await createTestApp();

  try {
    const payoutResponse = await postJson(app, '/customers/me/payouts', 'user_demo_alice', {
      amountMinor: 2500,
      recipientRailId: PAYOUT_TEST_RECIPIENT_RAIL_ID,
      reference: 'Invoice 204',
      sourceCurrency: 'USD',
      sourceWalletId: PAYOUT_TEST_WALLET_ID,
    });

    assert.equal(payoutResponse.status, 201);
    assert.equal((payoutResponse.body.payout as { status: string }).status, 'pending_submission');
    assert.match((payoutResponse.body.payout as { reference: string }).reference, /^payout-/u);
    assert.equal(
      (payoutResponse.body.amounts as { fee: { amountMinor: string } }).fee.amountMinor,
      '3',
    );
    assert.equal(
      (payoutResponse.body.amounts as { gross: { amountMinor: string } }).gross.amountMinor,
      '2503',
    );
    assert.equal(
      (payoutResponse.body.amounts as { net: { amountMinor: string } }).net.amountMinor,
      '2500',
    );

    const balancesResponse = await fetchJson(app, '/customers/me/balances', 'user_demo_alice');

    assert.equal(balancesResponse.status, 200);
    assert.equal(
      (balancesResponse.body.balances as Array<{ available: { amountMinor: string } }>)[0]
        ?.available.amountMinor,
      '7297',
    );
  } finally {
    await app.close();
  }
});

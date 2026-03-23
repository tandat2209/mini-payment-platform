import assert from 'node:assert/strict';
import test from 'node:test';

import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { configureApp } from '../../src/app.factory';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';

type FundingWebhookEvent = {
  event_type: string;
  external_event_id: string;
  id: string;
  payload: string;
  processed_at?: string | null;
  processing_status: string;
  provider: string;
  received_at: string;
};

type FundingUser = {
  external_ref: string;
  id: string;
};

type FundingWallet = {
  id: string;
  status: 'active' | 'closed';
  user_id: string;
};

type FundingDetail = {
  currency: string | null;
  details: Record<string, unknown>;
  id: string;
  is_active: boolean;
  rail: string;
  wallet_id: string;
};

type WalletBalance = {
  available_amount_minor: number;
  currency: string;
  id: string;
  pending_amount_minor: number;
  updated_at: string;
  wallet_id: string;
};

type LedgerAccount = {
  account_type: string;
  code: string;
  currency: string;
  id: string;
  owner_id: string | null;
  owner_type: string | null;
  status: string;
};

type UserTransaction = {
  currency: string;
  description: string;
  direction: string;
  fee_amount_minor: number;
  gross_amount_minor: number;
  id: string;
  net_amount_minor: number;
  occurred_at: string;
  posted_at: string;
  reference: string | null;
  status: string;
  type: string;
  user_id: string;
  wallet_id: string;
  webhook_event_id: string | null;
};

type LedgerTransaction = {
  currency: string;
  description: string;
  id: string;
  posted_at: string;
  reference: string | null;
  status: string;
  transaction_type: string;
  user_transaction_id: string | null;
  webhook_event_id: string | null;
};

type LedgerEntry = {
  amount_minor: number;
  created_at: string;
  currency: string;
  description: string;
  direction: string;
  id: string;
  ledger_account_id: string;
  ledger_transaction_id: string;
};

type FakeFundingDatabaseState = {
  fundingDetails: FundingDetail[];
  ledgerAccounts: LedgerAccount[];
  ledgerEntries: LedgerEntry[];
  ledgerTransactions: LedgerTransaction[];
  userTransactions: UserTransaction[];
  users: FundingUser[];
  walletBalances: WalletBalance[];
  wallets: FundingWallet[];
  webhookEvents: FundingWebhookEvent[];
};

class FundingWebhookFakeDatabaseService {
  readonly state: FakeFundingDatabaseState;

  constructor(overrides?: Partial<FakeFundingDatabaseState>) {
    this.state = {
      fundingDetails: [
        {
          currency: 'USD',
          details: {
            accountNumber: '1234567890',
            routingNumber: '021000021',
          },
          id: 'funding-detail-usd',
          is_active: true,
          rail: 'bank_transfer',
          wallet_id: 'wallet-alice',
        },
        {
          currency: 'EUR',
          details: {
            iban: 'DE89370400440532013000',
          },
          id: 'funding-detail-eur',
          is_active: true,
          rail: 'virtual_iban',
          wallet_id: 'wallet-alice',
        },
      ],
      ledgerAccounts: [
        {
          account_type: 'liability',
          code: 'wallet_alice_usd',
          currency: 'USD',
          id: 'ledger-wallet-usd',
          owner_id: 'wallet-alice',
          owner_type: 'wallet',
          status: 'open',
        },
        {
          account_type: 'asset',
          code: 'platform_cash_usd',
          currency: 'USD',
          id: 'ledger-platform-cash-usd',
          owner_id: null,
          owner_type: 'platform',
          status: 'open',
        },
      ],
      ledgerEntries: [],
      ledgerTransactions: [],
      userTransactions: [],
      users: [
        { external_ref: 'user_demo_alice', id: 'alice-id' },
        { external_ref: 'user_demo_bob', id: 'bob-id' },
      ],
      walletBalances: [
        {
          available_amount_minor: 9800,
          currency: 'USD',
          id: 'balance-usd-alice',
          pending_amount_minor: 0,
          updated_at: '2026-03-22T01:20:00.000Z',
          wallet_id: 'wallet-alice',
        },
      ],
      wallets: [
        { id: 'wallet-alice', status: 'active', user_id: 'alice-id' },
        { id: 'wallet-bob', status: 'active', user_id: 'bob-id' },
      ],
      webhookEvents: [],
      ...overrides,
    };
  }

  async getHealth() {
    return {
      configured: true as const,
      database: 'test',
      status: 'ok' as const,
    };
  }

  async transaction<T>(callback: (database: this) => Promise<T>) {
    return await callback(this);
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    parameters: readonly unknown[] = [],
  ) {
    const withRows = (rows: Record<string, unknown>[]) => ({
      rows: rows as T[],
    });

    if (sql.includes('INSERT INTO webhook_events')) {
      const [id, provider, externalEventId, eventType, payload, receivedAt] = parameters;
      const existing = this.state.webhookEvents.find(
        (event) =>
          event.provider === String(provider) &&
          event.external_event_id === String(externalEventId),
      );

      if (existing) {
        return withRows([]);
      }

      const row: FundingWebhookEvent = {
        event_type: String(eventType),
        external_event_id: String(externalEventId),
        id: String(id),
        payload: String(payload),
        processed_at: null,
        processing_status: 'received',
        provider: String(provider),
        received_at: String(receivedAt),
      };

      this.state.webhookEvents.push(row);

      return withRows([row]);
    }

    if (sql.includes('FROM webhook_events') && sql.includes('external_event_id = $2')) {
      const [provider, externalEventId] = parameters;
      const row = this.state.webhookEvents.find(
        (event) =>
          event.provider === String(provider) &&
          event.external_event_id === String(externalEventId),
      );

      return withRows(row ? [row] : []);
    }

    if (sql.includes('FROM webhook_events') && sql.includes('WHERE id = $1::uuid')) {
      const [webhookId] = parameters;
      const row = this.state.webhookEvents.find((event) => event.id === String(webhookId));

      return withRows(row ? [row] : []);
    }

    if (sql.includes('UPDATE webhook_events') && sql.includes('processing_status = $2')) {
      const [webhookId, processingStatus, processedAt] = parameters;
      const row = this.state.webhookEvents.find((event) => event.id === String(webhookId));

      if (row) {
        row.processing_status = String(processingStatus);
        row.processed_at = String(processedAt);
      }

      return withRows([]);
    }

    if (sql.includes('JOIN wallet_funding_details wfd') && sql.includes('wfd.currency = $2')) {
      const [destinationIdentifier, currency] = parameters;
      const activeWallet = this.state.wallets.find(
        (wallet) => wallet.id === 'wallet-alice' && wallet.status === 'active',
      );
      const detail = this.state.fundingDetails.find((item) => {
        if (
          item.wallet_id !== activeWallet?.id ||
          !item.is_active ||
          item.currency !== String(currency)
        ) {
          return false;
        }

        if (sql.includes("wfd.details->>'accountNumber' = $1")) {
          return item.details.accountNumber === String(destinationIdentifier);
        }

        if (sql.includes("UPPER(wfd.details->>'iban') = UPPER($1)")) {
          return String(item.details.iban ?? '').toUpperCase() === String(destinationIdentifier);
        }

        if (sql.includes('virtual_account')) {
          return (
            (item.rail === 'virtual_account' || item.rail === 'virtual_iban') &&
            String(item.details.virtualAccountNumber ?? item.details.accountNumber ?? '') ===
              String(destinationIdentifier)
          );
        }

        return false;
      });

      if (!activeWallet || !detail) {
        return withRows([]);
      }

      return withRows([{ user_id: 'alice-id', wallet_id: activeWallet.id }]);
    }

    if (sql.includes('INSERT INTO wallet_balances')) {
      const [id, walletId, currency, amountMinor, updatedAt] = parameters;
      const existing = this.state.walletBalances.find(
        (balance) =>
          balance.wallet_id === String(walletId) && balance.currency === String(currency),
      );

      if (existing) {
        existing.available_amount_minor += Number(amountMinor);
        existing.updated_at = String(updatedAt);
      } else {
        this.state.walletBalances.push({
          available_amount_minor: Number(amountMinor),
          currency: String(currency),
          id: String(id),
          pending_amount_minor: 0,
          updated_at: String(updatedAt),
          wallet_id: String(walletId),
        });
      }

      return withRows([]);
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes("owner_type = 'wallet'")) {
      const [walletId, currency] = parameters;
      const row = this.state.ledgerAccounts.find(
        (account) =>
          account.owner_type === 'wallet' &&
          account.owner_id === String(walletId) &&
          account.currency === String(currency) &&
          account.account_type === 'liability' &&
          account.status === 'open',
      );

      return withRows(row ? [{ id: row.id }] : []);
    }

    if (sql.includes('FROM ledger_accounts') && sql.includes('owner_id IS NULL')) {
      const [currency] = parameters;
      const row = this.state.ledgerAccounts.find(
        (account) =>
          account.owner_type === 'platform' &&
          account.owner_id === null &&
          account.currency === String(currency) &&
          account.account_type === 'asset' &&
          account.status === 'open',
      );

      return withRows(row ? [{ id: row.id }] : []);
    }

    if (sql.includes('INSERT INTO ledger_accounts')) {
      const [id, code, name, ownerIdOrCurrency, maybeCurrency, maybeNow] = parameters;

      if (sql.includes("'liability'")) {
        const ownerId = String(ownerIdOrCurrency);
        const currency = String(maybeCurrency);

        if (!this.state.ledgerAccounts.some((account) => account.code === String(code))) {
          this.state.ledgerAccounts.push({
            account_type: 'liability',
            code: String(code),
            currency,
            id: String(id),
            owner_id: ownerId,
            owner_type: 'wallet',
            status: 'open',
          });
        }
      } else {
        const currency = String(ownerIdOrCurrency);
        void name;
        void maybeNow;

        if (!this.state.ledgerAccounts.some((account) => account.code === String(code))) {
          this.state.ledgerAccounts.push({
            account_type: 'asset',
            code: String(code),
            currency,
            id: String(id),
            owner_id: null,
            owner_type: 'platform',
            status: 'open',
          });
        }
      }

      return withRows([]);
    }

    if (sql.includes('INSERT INTO user_transactions')) {
      const [
        id,
        userId,
        walletId,
        webhookEventId,
        currency,
        amountMinor,
        description,
        reference,
        occurredAt,
        postedAt,
      ] = parameters;

      this.state.userTransactions.push({
        currency: String(currency),
        description: String(description),
        direction: 'credit',
        fee_amount_minor: 0,
        gross_amount_minor: Number(amountMinor),
        id: String(id),
        net_amount_minor: Number(amountMinor),
        occurred_at: String(occurredAt),
        posted_at: String(postedAt),
        reference: String(reference),
        status: 'completed',
        type: 'funding',
        user_id: String(userId),
        wallet_id: String(walletId),
        webhook_event_id: String(webhookEventId),
      });

      return withRows([]);
    }

    if (sql.includes('INSERT INTO ledger_transactions')) {
      const [
        id,
        userTransactionId,
        webhookEventId,
        transactionType,
        currency,
        reference,
        description,
        now,
      ] = parameters;

      this.state.ledgerTransactions.push({
        currency: String(currency),
        description: String(description),
        id: String(id),
        posted_at: String(now),
        reference: String(reference),
        status: 'posted',
        transaction_type: String(transactionType),
        user_transaction_id: String(userTransactionId),
        webhook_event_id: String(webhookEventId),
      });

      return withRows([]);
    }

    if (sql.includes('INSERT INTO ledger_entries')) {
      const createdAt = String(parameters[parameters.length - 1]);
      const entryParameters = parameters.slice(0, -1);

      for (let index = 0; index < entryParameters.length; index += 7) {
        const [
          id,
          ledgerTransactionId,
          ledgerAccountId,
          direction,
          currency,
          amountMinor,
          description,
        ] = entryParameters.slice(index, index + 7);

        this.state.ledgerEntries.push({
          amount_minor: Number(amountMinor),
          created_at: createdAt,
          currency: String(currency),
          description: String(description),
          direction: String(direction),
          id: String(id),
          ledger_account_id: String(ledgerAccountId),
          ledger_transaction_id: String(ledgerTransactionId),
        });
      }

      return withRows([]);
    }

    throw new Error(`Unhandled SQL in funding webhook fake database: ${sql}`);
  }
}

async function createFundingWebhookTestApp(
  databaseService = new FundingWebhookFakeDatabaseService(),
) {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DatabaseService)
    .useValue(databaseService)
    .compile();

  const app = configureApp(testingModule.createNestApplication());
  await app.init();

  return {
    app,
    databaseService,
  };
}

async function postJson(app: INestApplication, path: string, body: Record<string, unknown>) {
  const port = await ensureListening(app);
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
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

function buildFundingPayload(overrides?: Partial<Record<string, unknown>>) {
  return {
    data: {
      amountMinor: 2500,
      currency: 'USD',
      description: 'Salary top up',
      destinationIdentifier: '1234567890',
      destinationType: 'account_number',
      providerReference: 'bank-ref-001',
      sender: {
        accountIdentifier: '99887766',
        bankCode: 'VCB',
        bankName: 'Vietcombank',
        name: 'Alice Nguyen',
      },
    },
    eventType: 'funding.completed',
    externalEventId: 'evt_funding_test_001',
    occurredAt: '2026-03-23T06:00:00.000Z',
    provider: 'simulator_psp',
    ...overrides,
  };
}

test('funding webhook end-to-end flow updates webhook, balance, transaction, and ledger', async () => {
  const { app, databaseService } = await createFundingWebhookTestApp();

  try {
    const response = await postJson(app, '/webhooks/funding', buildFundingPayload());
    const walletBalance = databaseService.state.walletBalances.find(
      (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'USD',
    );
    const userTransaction = databaseService.state.userTransactions[0];
    const ledgerTransaction = databaseService.state.ledgerTransactions[0];
    const ledgerEntries = databaseService.state.ledgerEntries;

    assert.equal(response.status, 202);
    assert.equal(response.body.duplicate as boolean, false);
    assert.equal(
      (response.body.event as { processingStatus: string }).processingStatus,
      'processed',
    );
    assert.equal(
      (response.body.event as { externalEventId: string }).externalEventId,
      'evt_funding_test_001',
    );
    assert.equal(databaseService.state.webhookEvents[0]?.processing_status, 'processed');
    assert.equal(walletBalance?.available_amount_minor, 12300);
    assert.equal(databaseService.state.userTransactions.length, 1);
    assert.equal(userTransaction?.type, 'funding');
    assert.equal(userTransaction?.direction, 'credit');
    assert.equal(userTransaction?.gross_amount_minor, 2500);
    assert.equal(userTransaction?.net_amount_minor, 2500);
    assert.equal(userTransaction?.description, 'Funding received from Alice Nguyen: Salary top up');
    assert.equal(userTransaction?.wallet_id, 'wallet-alice');
    assert.equal(userTransaction?.user_id, 'alice-id');
    assert.equal(userTransaction?.reference, 'funding-evt_funding_test_001');
    assert.equal(databaseService.state.ledgerTransactions.length, 1);
    assert.equal(ledgerTransaction?.transaction_type, 'funding');
    assert.equal(ledgerTransaction?.currency, 'USD');
    assert.equal(
      ledgerTransaction?.description,
      'Inbound funding recognized from provider webhook (bank-ref-001)',
    );
    assert.equal(ledgerTransaction?.reference, 'funding-evt_funding_test_001');
    assert.equal(ledgerTransaction?.user_transaction_id, userTransaction?.id ?? null);
    assert.equal(databaseService.state.ledgerEntries.length, 2);
    assert.deepEqual(
      ledgerEntries.map((entry) => ({
        amountMinor: entry.amount_minor,
        description: entry.description,
        direction: entry.direction,
        ledgerAccountId: entry.ledger_account_id,
      })),
      [
        {
          amountMinor: 2500,
          description: 'Provider cash received',
          direction: 'debit',
          ledgerAccountId: 'ledger-platform-cash-usd',
        },
        {
          amountMinor: 2500,
          description: 'Wallet liability increased',
          direction: 'credit',
          ledgerAccountId: 'ledger-wallet-usd',
        },
      ],
    );
  } finally {
    await app.close();
  }
});

test('funding webhook replay does not duplicate financial side effects', async () => {
  const { app, databaseService } = await createFundingWebhookTestApp();

  try {
    const payload = buildFundingPayload({ externalEventId: 'evt_funding_replay_001' });

    const firstResponse = await postJson(app, '/webhooks/funding', payload);
    const secondResponse = await postJson(app, '/webhooks/funding', payload);

    assert.equal(firstResponse.status, 202);
    assert.equal(secondResponse.status, 202);
    assert.equal(secondResponse.body.duplicate as boolean, true);
    assert.equal(
      (secondResponse.body.event as { processingStatus: string }).processingStatus,
      'processed',
    );
    assert.equal(databaseService.state.userTransactions.length, 1);
    assert.equal(databaseService.state.ledgerTransactions.length, 1);
    assert.equal(databaseService.state.ledgerEntries.length, 2);
    assert.equal(
      databaseService.state.walletBalances.find(
        (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'USD',
      )?.available_amount_minor,
      12300,
    );
  } finally {
    await app.close();
  }
});

test('funding webhook marks invalid funding targets as failed without mutations', async () => {
  const { app, databaseService } = await createFundingWebhookTestApp();

  try {
    const response = await postJson(
      app,
      '/webhooks/funding',
      buildFundingPayload({
        data: {
          amountMinor: 2500,
          currency: 'USD',
          destinationIdentifier: '0000000000',
          destinationType: 'account_number',
        },
        externalEventId: 'evt_funding_invalid_001',
      }),
    );

    assert.equal(response.status, 202);
    assert.equal(response.body.duplicate as boolean, false);
    assert.equal((response.body.event as { processingStatus: string }).processingStatus, 'failed');
    assert.equal(databaseService.state.userTransactions.length, 0);
    assert.equal(databaseService.state.ledgerTransactions.length, 0);
    assert.equal(databaseService.state.ledgerEntries.length, 0);
    assert.equal(
      databaseService.state.walletBalances.find(
        (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'USD',
      )?.available_amount_minor,
      9800,
    );
  } finally {
    await app.close();
  }
});

test('funding webhook provisions missing balance rows and ledger accounts for a new currency', async () => {
  const { app, databaseService } = await createFundingWebhookTestApp(
    new FundingWebhookFakeDatabaseService({
      fundingDetails: [
        {
          currency: 'GBP',
          details: {
            accountNumber: '4455667788',
          },
          id: 'funding-detail-gbp',
          is_active: true,
          rail: 'bank_transfer',
          wallet_id: 'wallet-alice',
        },
      ],
      ledgerAccounts: [],
      walletBalances: [],
    }),
  );

  try {
    const response = await postJson(
      app,
      '/webhooks/funding',
      buildFundingPayload({
        data: {
          amountMinor: 3300,
          currency: 'GBP',
          destinationIdentifier: '4455667788',
          destinationType: 'account_number',
        },
        externalEventId: 'evt_funding_gbp_001',
      }),
    );

    assert.equal(response.status, 202);
    assert.equal(
      (response.body.event as { processingStatus: string }).processingStatus,
      'processed',
    );
    assert.equal(
      databaseService.state.walletBalances.find(
        (balance) => balance.wallet_id === 'wallet-alice' && balance.currency === 'GBP',
      )?.available_amount_minor,
      3300,
    );
    assert.ok(
      databaseService.state.ledgerAccounts.find(
        (account) =>
          account.owner_type === 'wallet' &&
          account.owner_id === 'wallet-alice' &&
          account.currency === 'GBP',
      ),
    );
    assert.ok(
      databaseService.state.ledgerAccounts.find(
        (account) =>
          account.owner_type === 'platform' &&
          account.owner_id === null &&
          account.currency === 'GBP',
      ),
    );
  } finally {
    await app.close();
  }
});

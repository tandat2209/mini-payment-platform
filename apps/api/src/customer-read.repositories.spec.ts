import assert from 'node:assert/strict';
import test from 'node:test';

import { type DatabaseService } from './database/database.service';
import { SqlRecipientQueryRepository } from './recipients/infrastructure/sql-recipient-query.repository';
import { decodeTransactionCursor } from './shared/api/cursor';
import { SqlStatementQueryRepository } from './transactions/infrastructure/sql-statement-query.repository';
import { SqlTransactionQueryRepository } from './transactions/infrastructure/sql-transaction-query.repository';
import { SqlWalletBalanceQueryRepository } from './wallets/infrastructure/sql-wallet-balance-query.repository';
import { SqlWalletFundingDetailsQueryRepository } from './wallets/infrastructure/sql-wallet-funding-details-query.repository';

class FakeDatabaseService {
  readonly calls: Array<{ parameters: readonly unknown[]; sql: string }> = [];

  constructor(private readonly responses: unknown[][]) {}

  async query<T>(sql: string, parameters: readonly unknown[] = []) {
    this.calls.push({ parameters, sql });

    const rows = this.responses.shift();

    if (!rows) {
      throw new Error(`No fake response configured for SQL: ${sql}`);
    }

    return {
      rows: rows as T[],
    };
  }
}

test('balance repository returns the active wallet balance summary for the customer', async () => {
  const databaseService = new FakeDatabaseService([
    [
      {
        available_amount_minor: '9800',
        currency: 'USD',
        pending_amount_minor: '0',
        updated_at: '2026-03-22T01:20:00.000Z',
        wallet_id: 'wallet-alice',
        wallet_status: 'active',
      },
    ],
  ]);
  const repository = new SqlWalletBalanceQueryRepository(
    databaseService as unknown as DatabaseService,
  );

  const result = await repository.getActiveWalletBalances('customer-alice');

  assert.deepEqual(result, {
    balances: [
      {
        availableAmountMinor: '9800',
        currency: 'USD',
        pendingAmountMinor: '0',
        updatedAt: '2026-03-22T01:20:00.000Z',
      },
    ],
    walletId: 'wallet-alice',
    walletStatus: 'active',
  });
  assert.equal(databaseService.calls[0]?.parameters[0], 'customer-alice');
});

test('funding details repository returns the active wallet funding details for the customer', async () => {
  const databaseService = new FakeDatabaseService([
    [
      {
        funding_detail_currency: 'USD',
        funding_detail_details: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
        },
        funding_detail_id: 'funding-detail-1',
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
        funding_detail_id: 'funding-detail-2',
        funding_detail_rail: 'virtual_iban',
        funding_detail_updated_at: '2026-03-22T01:05:00.000Z',
        wallet_id: 'wallet-alice',
        wallet_status: 'active',
      },
    ],
  ]);
  const repository = new SqlWalletFundingDetailsQueryRepository(
    databaseService as unknown as DatabaseService,
  );

  const result = await repository.getActiveWalletFundingDetails('customer-alice');

  assert.deepEqual(result, {
    fundingDetails: [
      {
        currency: 'USD',
        details: {
          accountNumber: '1234567890',
          routingNumber: '021000021',
        },
        id: 'funding-detail-1',
        rail: 'bank_transfer',
        updatedAt: '2026-03-22T01:00:00.000Z',
      },
      {
        currency: 'EUR',
        details: {
          iban: 'DE89370400440532013000',
        },
        id: 'funding-detail-2',
        rail: 'virtual_iban',
        updatedAt: '2026-03-22T01:05:00.000Z',
      },
    ],
    walletId: 'wallet-alice',
    walletStatus: 'active',
  });
  assert.equal(databaseService.calls[0]?.parameters[0], 'customer-alice');
});

test('recipient repository masks sensitive rail details for recipient detail', async () => {
  const databaseService = new FakeDatabaseService([
    [
      {
        created_at: '2026-03-22T01:15:00.000Z',
        id: 'recipient-1',
        name: 'Vendor One',
        status: 'active',
      },
    ],
    [
      {
        currency: 'USD',
        details: {
          accountNumber: '9876543210',
          routingNumber: '011000015',
        },
        id: 'rail-1',
        is_default: true,
        rail: 'ach',
        recipient_id: 'recipient-1',
      },
    ],
  ]);
  const repository = new SqlRecipientQueryRepository(databaseService as unknown as DatabaseService);

  const result = await repository.getRecipientDetail('customer-alice', 'recipient-1');

  assert.deepEqual(result?.rails[0]?.details, {
    accountNumber: '******3210',
    routingNumber: '*****0015',
  });
  assert.deepEqual(databaseService.calls[0]?.parameters, ['customer-alice', 'recipient-1']);
});

test('transaction repository applies filters and returns a next cursor when another page exists', async () => {
  const databaseService = new FakeDatabaseService([
    [
      {
        currency: 'USD',
        description: 'Funding received',
        direction: 'credit',
        fee_amount_minor: '0',
        gross_amount_minor: '10000',
        id: 'txn-2',
        net_amount_minor: '10000',
        occurred_at: '2026-03-22T01:20:00.000Z',
        posted_at: '2026-03-22T01:20:00.000Z',
        reference: 'funding-2',
        status: 'completed',
        type: 'funding',
      },
      {
        currency: 'USD',
        description: 'Funding received',
        direction: 'credit',
        fee_amount_minor: '0',
        gross_amount_minor: '5000',
        id: 'txn-1',
        net_amount_minor: '5000',
        occurred_at: '2026-03-22T01:10:00.000Z',
        posted_at: '2026-03-22T01:10:00.000Z',
        reference: 'funding-1',
        status: 'completed',
        type: 'funding',
      },
    ],
  ]);
  const repository = new SqlTransactionQueryRepository(
    databaseService as unknown as DatabaseService,
  );

  const result = await repository.listTransactions('customer-alice', {
    currency: 'USD',
    cursor: null,
    dateFrom: '2026-03-22T00:00:00.000Z',
    dateTo: '2026-03-22T23:59:59.000Z',
    limit: 1,
    status: 'completed',
    type: 'funding',
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.id, 'txn-2');
  assert.ok(result.nextCursor);
  assert.deepEqual(decodeTransactionCursor(result.nextCursor ?? undefined), {
    id: 'txn-2',
    occurredAt: '2026-03-22T01:20:00.000Z',
  });
  assert.match(databaseService.calls[0]?.sql ?? '', /ut\.currency = \$2/);
  assert.match(databaseService.calls[0]?.sql ?? '', /ut\.type = \$3/);
  assert.match(databaseService.calls[0]?.sql ?? '', /ut\.status = \$4/);
});

test('statement repository returns only settled statement detail and computes balances', async () => {
  const databaseService = new FakeDatabaseService([
    [{ id: 'wallet-alice' }],
    [
      {
        currency: 'USD',
        description: 'Funding received',
        direction: 'credit',
        fee_amount_minor: '0',
        gross_amount_minor: '10000',
        id: 'txn-1',
        net_amount_minor: '10000',
        occurred_at: '2026-03-22T01:10:30.000Z',
        posted_at: '2026-03-22T01:10:30.000Z',
        reference: 'funding-001',
        status: 'completed',
        type: 'funding',
      },
      {
        currency: 'USD',
        description: 'Payout to Vendor One',
        direction: 'debit',
        fee_amount_minor: '3000',
        gross_amount_minor: '3200',
        id: 'txn-2',
        net_amount_minor: '200',
        occurred_at: '2026-03-22T01:20:00.000Z',
        posted_at: '2026-03-22T01:21:20.000Z',
        reference: 'payout-001',
        status: 'completed',
        type: 'payout',
      },
    ],
    [
      {
        closing_balance_minor: '9800',
        opening_balance_minor: '0',
        total_credits_minor: '10000',
        total_debits_minor: '200',
      },
    ],
  ]);
  const repository = new SqlStatementQueryRepository(databaseService as unknown as DatabaseService);

  const result = await repository.getStatementDetail(
    'customer-alice',
    'wallet-alice',
    'USD',
    2026,
    3,
  );

  assert.equal(result?.openingBalanceMinor, '0');
  assert.equal(result?.closingBalanceMinor, '9800');
  assert.equal(result?.lineItems.length, 2);
  assert.match(
    databaseService.calls[1]?.sql ?? '',
    /ut\.status IN \('posted', 'completed', 'reversed'\)/,
  );
});

import assert from 'node:assert/strict';
import test from 'node:test';

import type { LedgerAccountService } from '../../ledger/application/ledger-account.service';
import type { LedgerPostingService } from '../../ledger/application/ledger-posting.service';
import { type CreatePostedLedgerTransactionInput } from '../../ledger/domain/ledger.types';
import {
  TransactionContext,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import type { PayoutWebhookStore } from '../domain/payout-webhook.store';
import {
  type PayoutWebhook,
  type RecordedPayoutWebhookEvent,
} from '../domain/payout-webhook.types';
import {
  type PayoutExecutionRecord,
  type PayoutWalletRepository,
  type PayoutWriteRepository,
} from '../domain/payout-write.repositories';
import { ApplyPayoutWebhookService } from './apply-payout-webhook.service';

class TestTransactionContext extends TransactionContext {}

class ImmediateTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return await operation(new TestTransactionContext());
  }
}

class InMemoryPayoutWebhookStore implements PayoutWebhookStore {
  existingEvent: RecordedPayoutWebhookEvent | null = null;
  processingUpdates: Array<{
    processedAt: string;
    processingStatus: 'failed' | 'processed';
    webhookId: string;
  }> = [];
  recorded: Array<{ payload: PayoutWebhook; webhookId: string }> = [];
  returnDuplicate = false;

  async recordReceived(
    _context: TransactionContext,
    payload: PayoutWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedPayoutWebhookEvent | null> {
    if (this.returnDuplicate) {
      return null;
    }

    this.recorded.push({ payload, webhookId });

    return {
      duplicate: false,
      eventType: payload.eventType,
      externalEventId: payload.externalEventId,
      id: webhookId,
      processingStatus: 'received',
      provider: payload.provider,
      receivedAt,
    };
  }

  async findByProviderEvent(): Promise<RecordedPayoutWebhookEvent | null> {
    return this.existingEvent;
  }

  async markProcessingStatus(
    _context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
    processedAt: string,
  ): Promise<RecordedPayoutWebhookEvent> {
    this.processingUpdates.push({
      processedAt,
      processingStatus,
      webhookId,
    });

    return {
      duplicate: false,
      eventType: 'payout.updated',
      externalEventId: this.recorded.at(-1)?.payload.externalEventId ?? 'evt',
      id: webhookId,
      processingStatus,
      provider: this.recorded.at(-1)?.payload.provider ?? 'psp_sandbox',
      receivedAt: processedAt,
    };
  }
}

class InMemoryPayoutWalletRepository implements PayoutWalletRepository {
  creditCalls: Array<{
    amountMinor: number;
    currency: string;
    updatedAt: string;
    walletId: string;
  }> = [];

  async creditAvailableBalance(
    _context: TransactionContext,
    input: { amountMinor: number; currency: string; updatedAt: string; walletId: string },
  ): Promise<void> {
    this.creditCalls.push(input);
  }

  async debitAvailableBalance(): Promise<boolean> {
    throw new Error('debitAvailableBalance should not be called in payout webhook tests');
  }

  async findOwnedActiveWalletBalance(): Promise<null> {
    throw new Error('findOwnedActiveWalletBalance should not be called in payout webhook tests');
  }
}

class InMemoryPayoutWriteRepository implements PayoutWriteRepository {
  attemptOutcomeUpdates: Array<{
    attemptId: string;
    resolvedAt?: string;
    responsePayload: Record<string, unknown>;
    status: 'failed' | 'processing' | 'succeeded';
  }> = [];
  executionRecord: PayoutExecutionRecord | null;
  failedUpdates: Array<{
    failedAt: string;
    payoutId: string;
    updatedAt: string;
    userTransactionId: string;
    webhookEventId: string;
  }> = [];
  paidUpdates: Array<{
    completedAt: string;
    payoutId: string;
    updatedAt: string;
    userTransactionId: string;
    webhookEventId: string;
  }> = [];
  processingUpdates: Array<{
    payoutId: string;
    updatedAt: string;
  }> = [];
  returnedCreditTransactions: Array<{
    amountMinor: number;
    createdAt: string;
    currency: string;
    description: string;
    occurredAt: string;
    payoutId: string;
    reference: string | null;
    userId: string;
    userTransactionId: string;
    walletId: string;
    webhookEventId: string;
  }> = [];
  returnedUpdates: Array<{
    payoutId: string;
    userTransactionId: string;
    webhookEventId: string;
    returnedAmountMinor: number;
    returnedAt: string;
    updatedAt: string;
  }> = [];

  constructor(executionRecord: PayoutExecutionRecord | null) {
    this.executionRecord = executionRecord;
  }

  async createPayoutBooking(): Promise<void> {
    throw new Error('createPayoutBooking should not be called in payout webhook tests');
  }

  async findExecutionByProviderPayoutId(): Promise<PayoutExecutionRecord | null> {
    return this.executionRecord;
  }

  async markPayoutAsFailed(
    _context: TransactionContext,
    input: {
      failedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    this.failedUpdates.push(input);
  }

  async markPayoutAsPaid(
    _context: TransactionContext,
    input: {
      completedAt: string;
      payoutId: string;
      updatedAt: string;
      userTransactionId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    this.paidUpdates.push(input);
  }

  async markPayoutAsProcessing(
    _context: TransactionContext,
    input: {
      payoutId: string;
      updatedAt: string;
    },
  ): Promise<void> {
    this.processingUpdates.push(input);
  }

  async markPayoutAsReturned(
    _context: TransactionContext,
    input: {
      payoutId: string;
      userTransactionId: string;
      webhookEventId: string;
      returnedAmountMinor: number;
      returnedAt: string;
      updatedAt: string;
    },
  ): Promise<void> {
    this.returnedUpdates.push(input);
  }

  async createReturnedPayoutCreditTransaction(
    _context: TransactionContext,
    input: {
      amountMinor: number;
      createdAt: string;
      currency: string;
      description: string;
      occurredAt: string;
      payoutId: string;
      reference: string | null;
      userId: string;
      userTransactionId: string;
      walletId: string;
      webhookEventId: string;
    },
  ): Promise<void> {
    this.returnedCreditTransactions.push(input);
  }

  async recordSubmissionAttempt(): Promise<void> {
    throw new Error('recordSubmissionAttempt should not be called in payout webhook tests');
  }

  async updateAttemptOutcome(
    _context: TransactionContext,
    input: {
      attemptId: string;
      responsePayload: Record<string, unknown>;
      resolvedAt?: string;
      status: 'failed' | 'processing' | 'succeeded';
    },
  ): Promise<void> {
    this.attemptOutcomeUpdates.push(input);
  }

  async updatePayoutAfterSubmission(): Promise<void> {
    throw new Error('updatePayoutAfterSubmission should not be called in payout webhook tests');
  }
}

class StubLedgerAccountService {
  async ensurePlatformCashAccount(): Promise<string> {
    return 'platform-cash-account';
  }

  async ensurePlatformRevenueAccount(): Promise<string> {
    return 'platform-revenue-account';
  }

  async ensureRecipientPayableAccount(): Promise<string> {
    return 'recipient-payable-account';
  }

  async ensureWalletLiabilityAccount(): Promise<string> {
    return 'wallet-liability-account';
  }
}

class StubLedgerPostingService {
  createdTransactions: CreatePostedLedgerTransactionInput[] = [];

  async createPostedTransaction(
    _context: TransactionContext,
    input: CreatePostedLedgerTransactionInput,
  ): Promise<string> {
    this.createdTransactions.push(input);

    return `ledger-${this.createdTransactions.length}`;
  }
}

function createExecutionRecord(
  overrides: Partial<PayoutExecutionRecord> = {},
): PayoutExecutionRecord {
  return {
    attemptId: 'attempt-1',
    attemptStatus: 'accepted',
    currency: 'USD',
    feeAmountMinor: 3,
    grossAmountMinor: 2503,
    netAmountMinor: 2500,
    payoutId: 'payout-1',
    payoutReference: 'payout-001',
    payoutStatus: 'submitted',
    provider: 'psp_sandbox',
    recipientId: 'recipient-1',
    userId: 'customer-1',
    userTransactionId: 'txn-1',
    walletId: 'wallet-1',
    ...overrides,
  };
}

function createWebhookPayload(
  overrides: Partial<Extract<PayoutWebhook, { eventType: 'payout.updated' }>> = {},
): Extract<PayoutWebhook, { eventType: 'payout.updated' }> {
  return {
    data: {
      externalPayoutId: 'ppay_123',
      externalRequestId: 'preq_123',
      payoutReference: 'payout-001',
      status: 'paid',
    },
    eventType: 'payout.updated',
    externalEventId: 'evt_payout_001',
    occurredAt: '2026-03-26T10:00:00.000Z',
    provider: 'psp_sandbox',
    ...overrides,
  };
}

function createReturnedWebhookPayload(
  overrides: Partial<Extract<PayoutWebhook, { eventType: 'payout.returned' }>> = {},
): Extract<PayoutWebhook, { eventType: 'payout.returned' }> {
  return {
    data: {
      currency: 'USD',
      externalPayoutId: 'ppay_123',
      externalRequestId: 'preq_123',
      payoutReference: 'payout-001',
      returnedAmountMinor: 2503,
      status: 'returned',
    },
    eventType: 'payout.returned',
    externalEventId: 'evt_payout_returned_001',
    occurredAt: '2026-03-27T10:00:00.000Z',
    provider: 'psp_sandbox',
    ...overrides,
  };
}

test('apply payout webhook settles a paid payout', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(createExecutionRecord());
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(payoutWriteRepository.paidUpdates.length, 1);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates[0]?.status, 'succeeded');
  assert.equal(ledgerPostingService.createdTransactions[0]?.transactionType, 'payout_settlement');
  assert.deepEqual(
    ledgerPostingService.createdTransactions[0]?.entries.map((entry) => ({
      amountMinor: entry.amountMinor,
      direction: entry.direction,
      ledgerAccountId: entry.ledgerAccountId,
    })),
    [
      {
        amountMinor: 2500,
        direction: 'debit',
        ledgerAccountId: 'recipient-payable-account',
      },
      {
        amountMinor: 2500,
        direction: 'credit',
        ledgerAccountId: 'platform-cash-account',
      },
    ],
  );
});

test('apply payout webhook restores wallet and reverses revenue for a failed payout', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(createExecutionRecord());
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(
    createWebhookPayload({
      data: {
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        failureReason: 'bank_rejected',
        payoutReference: 'payout-001',
        status: 'failed',
      },
    }),
  );

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWalletRepository.creditCalls[0]?.amountMinor, 2503);
  assert.equal(payoutWriteRepository.failedUpdates.length, 1);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates[0]?.status, 'failed');
  assert.equal(ledgerPostingService.createdTransactions[0]?.transactionType, 'reversal');
  assert.deepEqual(
    ledgerPostingService.createdTransactions[0]?.entries.map((entry) => ({
      amountMinor: entry.amountMinor,
      direction: entry.direction,
      ledgerAccountId: entry.ledgerAccountId,
    })),
    [
      {
        amountMinor: 2500,
        direction: 'debit',
        ledgerAccountId: 'recipient-payable-account',
      },
      {
        amountMinor: 3,
        direction: 'debit',
        ledgerAccountId: 'platform-revenue-account',
      },
      {
        amountMinor: 2503,
        direction: 'credit',
        ledgerAccountId: 'wallet-liability-account',
      },
    ],
  );
});

test('apply payout webhook returns duplicate without side effects when the event was already recorded', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  webhookStore.returnDuplicate = true;
  webhookStore.existingEvent = {
    duplicate: false,
    eventType: 'payout.updated',
    externalEventId: 'evt_payout_001',
    id: 'webhook-existing',
    processingStatus: 'processed',
    provider: 'psp_sandbox',
    receivedAt: '2026-03-26T10:00:00.000Z',
  };
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(createExecutionRecord());
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.duplicate, true);
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook marks in-flight payout as processing', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(createExecutionRecord());
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(
    createWebhookPayload({
      data: {
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        payoutReference: 'payout-001',
        status: 'processing',
      },
    }),
  );

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWriteRepository.processingUpdates.length, 1);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates[0]?.status, 'processing');
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook noops terminal to processing transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      payoutStatus: 'paid',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(
    createWebhookPayload({
      data: {
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        payoutReference: 'payout-001',
        status: 'processing',
      },
    }),
  );

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWriteRepository.processingUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook noops duplicate paid transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      attemptStatus: 'succeeded',
      payoutStatus: 'paid',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWriteRepository.paidUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook noops duplicate failed transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      attemptStatus: 'failed',
      payoutStatus: 'failed',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(
    createWebhookPayload({
      data: {
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        failureReason: 'bank_rejected',
        payoutReference: 'payout-001',
        status: 'failed',
      },
    }),
  );

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWriteRepository.failedUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook rejects contradictory paid-after-failed transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      payoutStatus: 'failed',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.processingStatus, 'failed');
  assert.equal(payoutWriteRepository.paidUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook rejects contradictory failed-after-paid transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      payoutStatus: 'paid',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(
    createWebhookPayload({
      data: {
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        failureReason: 'bank_rejected',
        payoutReference: 'payout-001',
        status: 'failed',
      },
    }),
  );

  assert.equal(result.processingStatus, 'failed');
  assert.equal(payoutWriteRepository.failedUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
  assert.equal(payoutWalletRepository.creditCalls.length, 0);
  assert.equal(ledgerPostingService.createdTransactions.length, 0);
});

test('apply payout webhook restores wallet, reverses revenue, and records a return credit for returned payout', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      attemptStatus: 'succeeded',
      payoutStatus: 'paid',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createReturnedWebhookPayload());

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWalletRepository.creditCalls[0]?.amountMinor, 2506);
  assert.equal(payoutWriteRepository.returnedCreditTransactions.length, 1);
  assert.equal(payoutWriteRepository.returnedCreditTransactions[0]?.amountMinor, 2506);
  assert.equal(payoutWriteRepository.returnedUpdates.length, 1);
  assert.equal(payoutWriteRepository.returnedUpdates[0]?.returnedAmountMinor, 2503);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates[0]?.status, 'succeeded');
  assert.equal(ledgerPostingService.createdTransactions[0]?.transactionType, 'reversal');
  assert.deepEqual(
    ledgerPostingService.createdTransactions[0]?.entries.map((entry) => ({
      amountMinor: entry.amountMinor,
      direction: entry.direction,
      ledgerAccountId: entry.ledgerAccountId,
    })),
    [
      {
        amountMinor: 2503,
        direction: 'debit',
        ledgerAccountId: 'platform-cash-account',
      },
      {
        amountMinor: 3,
        direction: 'debit',
        ledgerAccountId: 'platform-revenue-account',
      },
      {
        amountMinor: 2506,
        direction: 'credit',
        ledgerAccountId: 'wallet-liability-account',
      },
    ],
  );
});

test('apply payout webhook noops duplicate returned transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      payoutStatus: 'returned',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createReturnedWebhookPayload());

  assert.equal(result.processingStatus, 'processed');
  assert.equal(payoutWriteRepository.returnedUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
});

test('apply payout webhook rejects returned-before-paid transition', async () => {
  const webhookStore = new InMemoryPayoutWebhookStore();
  const payoutWalletRepository = new InMemoryPayoutWalletRepository();
  const payoutWriteRepository = new InMemoryPayoutWriteRepository(
    createExecutionRecord({
      payoutStatus: 'submitted',
    }),
  );
  const ledgerPostingService = new StubLedgerPostingService();
  const service = new ApplyPayoutWebhookService(
    new ImmediateTransactionManager(),
    webhookStore,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute(createReturnedWebhookPayload());

  assert.equal(result.processingStatus, 'failed');
  assert.equal(payoutWriteRepository.returnedUpdates.length, 0);
  assert.equal(payoutWriteRepository.attemptOutcomeUpdates.length, 0);
});

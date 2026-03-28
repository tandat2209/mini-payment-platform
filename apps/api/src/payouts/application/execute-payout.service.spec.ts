import assert from 'node:assert/strict';
import test from 'node:test';

import type { LedgerAccountService } from '../../ledger/application/ledger-account.service';
import type { LedgerPostingService } from '../../ledger/application/ledger-posting.service';
import { type CreatePostedLedgerTransactionInput } from '../../ledger/domain/ledger.types';
import {
  TransactionContext,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import type { PayoutIdempotencyRepository } from '../domain/payout-idempotency.repository';
import { type PreparedPayoutIntent } from '../domain/payout-preparation.types';
import type { PayoutSubmissionGateway } from '../domain/payout-submission.gateway';
import {
  type OwnedWalletBalance,
  type PayoutWalletRepository,
  type PayoutWriteRepository,
} from '../domain/payout-write.repositories';
import {
  InsufficientWalletBalanceError,
  PayoutIdempotencyConflictError,
  PayoutSourceWalletNotFoundError,
} from '../domain/payout-write.types';
import { ExecutePayoutService } from './execute-payout.service';
import type { PreparePayoutIntentService } from './prepare-payout-intent.service';

class TestTransactionContext extends TransactionContext {}

class ImmediateTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return await operation(new TestTransactionContext());
  }
}

class StubPreparePayoutIntentService {
  constructor(private readonly preparedIntent: PreparedPayoutIntent) {}

  async prepare(): Promise<PreparedPayoutIntent> {
    return this.preparedIntent;
  }
}

class InMemoryPayoutWalletRepository implements PayoutWalletRepository {
  creditCalls: Array<{
    amountMinor: number;
    currency: string;
    updatedAt: string;
    walletId: string;
  }> = [];
  debitCalls: Array<{
    amountMinor: number;
    currency: string;
    updatedAt: string;
    walletId: string;
  }> = [];

  constructor(
    private readonly ownedWalletBalance: OwnedWalletBalance | null,
    private readonly debitResult = true,
  ) {}

  async findOwnedActiveWalletBalance(): Promise<OwnedWalletBalance | null> {
    return this.ownedWalletBalance;
  }

  async creditAvailableBalance(
    _context: TransactionContext,
    input: { amountMinor: number; currency: string; updatedAt: string; walletId: string },
  ): Promise<void> {
    this.creditCalls.push(input);
  }

  async debitAvailableBalance(
    _context: TransactionContext,
    input: { amountMinor: number; currency: string; updatedAt: string; walletId: string },
  ): Promise<boolean> {
    this.debitCalls.push(input);

    return this.debitResult;
  }
}

class InMemoryPayoutWriteRepository implements PayoutWriteRepository {
  createdBooking: {
    createdAt: string;
    currency: string;
    description: string;
    feeAmountMinor: number;
    grossAmountMinor: number;
    idempotencyKeyId?: string | null;
    netAmountMinor: number;
    occurredAt: string;
    payoutId: string;
    rail: string;
    recipientId: string;
    recipientRailId: string;
    reference: string;
    userId: string;
    userTransactionId: string;
    walletId: string;
  } | null = null;
  payoutSubmissionUpdate: {
    payoutId: string;
    status: 'submitted';
    submittedAt: string;
    updatedAt: string;
  } | null = null;
  recordedAttempt: {
    attemptId: string;
    externalPayoutId: string;
    externalRequestId: string;
    idempotencyKeyId?: string | null;
    payoutId: string;
    provider: string;
    requestPayload: Record<string, unknown>;
    responsePayload: Record<string, unknown>;
    status: 'accepted';
    submittedAt: string;
  } | null = null;

  async findExecutionByProviderPayoutId(): Promise<null> {
    return null;
  }

  async markPayoutAsFailed(): Promise<void> {}

  async markPayoutAsPaid(): Promise<void> {}

  async markPayoutAsProcessing(): Promise<void> {}

  async createPayoutBooking(
    _context: TransactionContext,
    input: {
      createdAt: string;
      currency: string;
      description: string;
      feeAmountMinor: number;
      grossAmountMinor: number;
      idempotencyKeyId?: string | null;
      netAmountMinor: number;
      occurredAt: string;
      payoutId: string;
      rail: string;
      recipientId: string;
      recipientRailId: string;
      reference: string;
      userId: string;
      userTransactionId: string;
      walletId: string;
    },
  ): Promise<void> {
    this.createdBooking = input;
  }

  async recordSubmissionAttempt(
    _context: TransactionContext,
    input: {
      attemptId: string;
      externalPayoutId: string;
      externalRequestId: string;
      idempotencyKeyId?: string | null;
      payoutId: string;
      provider: string;
      requestPayload: Record<string, unknown>;
      responsePayload: Record<string, unknown>;
      status: 'accepted';
      submittedAt: string;
    },
  ): Promise<void> {
    this.recordedAttempt = input;
  }

  async updatePayoutAfterSubmission(
    _context: TransactionContext,
    input: {
      payoutId: string;
      status: 'submitted';
      submittedAt: string;
      updatedAt: string;
    },
  ): Promise<void> {
    this.payoutSubmissionUpdate = input;
  }

  async updateAttemptOutcome(): Promise<void> {}
}

class InMemoryPayoutIdempotencyRepository implements PayoutIdempotencyRepository {
  claimResult:
    | {
        id: string;
        result: 'claimed';
      }
    | {
        id: string;
        requestFingerprint: string | null;
        responsePayload: ReturnType<typeof createCompletedPayoutResponse> | null;
        result: 'existing';
        status: 'completed' | 'created' | 'failed';
      };

  completedRecord: {
    id: string;
    responsePayload: ReturnType<typeof createCompletedPayoutResponse>;
    updatedAt: string;
  } | null = null;

  constructor(
    claimResult:
      | {
          id: string;
          result: 'claimed';
        }
      | {
          id: string;
          requestFingerprint: string | null;
          responsePayload: ReturnType<typeof createCompletedPayoutResponse> | null;
          result: 'existing';
          status: 'completed' | 'created' | 'failed';
        } = {
      id: 'idem-1',
      result: 'claimed',
    },
  ) {
    this.claimResult = claimResult;
  }

  async claimKey() {
    return this.claimResult;
  }

  async markCompleted(
    _context: TransactionContext,
    input: {
      id: string;
      responsePayload: ReturnType<typeof createCompletedPayoutResponse>;
      updatedAt: string;
    },
  ): Promise<void> {
    this.completedRecord = input;
  }
}

class StubLedgerAccountService {
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
  createdTransaction: CreatePostedLedgerTransactionInput | null = null;

  async createPostedTransaction(
    _context: TransactionContext,
    input: CreatePostedLedgerTransactionInput,
  ): Promise<string> {
    this.createdTransaction = input;

    return 'ledger-transaction-1';
  }
}

class StubPayoutSubmissionGateway {
  async submitPayout() {
    return {
      acceptedAt: '2026-03-26T08:10:00.000Z',
      externalPayoutId: 'ppay_123',
      externalRequestId: 'preq_123',
      provider: 'psp_sandbox' as const,
      providerStatus: 'accepted' as const,
      rawResponse: {
        acceptedAt: '2026-03-26T08:10:00.000Z',
        externalPayoutId: 'ppay_123',
        externalRequestId: 'preq_123',
        provider: 'psp_sandbox',
        status: 'accepted',
      },
    };
  }
}

function createPreparedIntent(overrides: Partial<PreparedPayoutIntent> = {}): PreparedPayoutIntent {
  return {
    amountMinor: 100_000,
    currency: 'USD',
    customerId: 'customer-1',
    rail: 'ach',
    recipientId: 'recipient-1',
    recipientName: 'Vendor One',
    recipientRailId: 'rail-1',
    reference: 'Invoice 1042',
    sourceWalletId: 'wallet-1',
    submissionTarget: {
      details: {
        accountNumber: '1234567890',
        routingNumber: '021000021',
      },
      mode: 'inline_recipient_details',
    },
    ...overrides,
  };
}

function createCompletedPayoutResponse() {
  return {
    amounts: {
      feeAmountMinor: '100',
      grossAmountMinor: '100100',
      netAmountMinor: '100000',
    },
    createdAt: '2026-03-26T07:42:00.000Z',
    currency: 'USD',
    payoutId: 'payout-1',
    recipient: {
      id: 'recipient-1',
      name: 'Vendor One',
      rail: 'ach',
      railId: 'rail-1',
    },
    reference: 'payout-existing',
    status: 'submitted' as const,
    transactionId: 'txn-1',
    walletId: 'wallet-1',
  };
}

test('execute payout books wallet debit, payout, and ledger entries with fee recognition', async () => {
  const payoutWalletRepository = new InMemoryPayoutWalletRepository({
    availableAmountMinor: 200_000,
    walletId: 'wallet-1',
  });
  const payoutWriteRepository = new InMemoryPayoutWriteRepository();
  const payoutIdempotencyRepository = new InMemoryPayoutIdempotencyRepository();
  const ledgerPostingService = new StubLedgerPostingService();
  const payoutSubmissionGateway = new StubPayoutSubmissionGateway();
  const service = new ExecutePayoutService(
    new ImmediateTransactionManager(),
    new StubPreparePayoutIntentService(
      createPreparedIntent(),
    ) as unknown as PreparePayoutIntentService,
    payoutIdempotencyRepository,
    payoutSubmissionGateway as unknown as PayoutSubmissionGateway,
    payoutWalletRepository,
    payoutWriteRepository,
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    ledgerPostingService as unknown as LedgerPostingService,
  );

  const result = await service.execute({
    amountMinor: 100_000,
    customerId: 'customer-1',
    idempotencyKey: 'idem-key-1',
    recipientRailId: 'rail-1',
    reference: 'Invoice 1042',
    sourceCurrency: 'USD',
    sourceWalletId: 'wallet-1',
  });

  assert.equal(result.currency, 'USD');
  assert.equal(result.status, 'submitted');
  assert.equal(result.amounts.netAmountMinor, '100000');
  assert.equal(result.amounts.feeAmountMinor, '100');
  assert.equal(result.amounts.grossAmountMinor, '100100');
  assert.equal(payoutWalletRepository.debitCalls.length, 1);
  assert.equal(payoutWalletRepository.debitCalls[0]?.amountMinor, 100_100);
  assert.equal(payoutWriteRepository.createdBooking?.feeAmountMinor, 100);
  assert.equal(payoutWriteRepository.createdBooking?.grossAmountMinor, 100_100);
  assert.equal(payoutWriteRepository.createdBooking?.idempotencyKeyId, 'idem-1');
  assert.equal(payoutWriteRepository.createdBooking?.netAmountMinor, 100_000);
  assert.match(payoutWriteRepository.createdBooking?.description ?? '', /^Payout to Vendor One:/u);
  assert.equal(payoutWriteRepository.recordedAttempt?.externalPayoutId, 'ppay_123');
  assert.equal(payoutWriteRepository.recordedAttempt?.externalRequestId, 'preq_123');
  assert.equal(payoutWriteRepository.recordedAttempt?.status, 'accepted');
  assert.equal(payoutWriteRepository.recordedAttempt?.provider, 'psp_sandbox');
  assert.equal(payoutWriteRepository.recordedAttempt?.idempotencyKeyId, 'idem-1');
  assert.equal(payoutWriteRepository.payoutSubmissionUpdate?.status, 'submitted');
  assert.equal(payoutWriteRepository.payoutSubmissionUpdate?.payoutId, result.payoutId);
  assert.equal(payoutIdempotencyRepository.completedRecord?.id, 'idem-1');
  assert.equal(ledgerPostingService.createdTransaction?.transactionType, 'payout');
  assert.deepEqual(
    ledgerPostingService.createdTransaction?.entries.map((entry) => ({
      amountMinor: entry.amountMinor,
      direction: entry.direction,
      ledgerAccountId: entry.ledgerAccountId,
    })),
    [
      {
        amountMinor: 100_100,
        direction: 'debit',
        ledgerAccountId: 'wallet-liability-account',
      },
      {
        amountMinor: 100_000,
        direction: 'credit',
        ledgerAccountId: 'recipient-payable-account',
      },
      {
        amountMinor: 100,
        direction: 'credit',
        ledgerAccountId: 'platform-revenue-account',
      },
    ],
  );
});

test('execute payout rejects when the source wallet balance is missing', async () => {
  const service = new ExecutePayoutService(
    new ImmediateTransactionManager(),
    new StubPreparePayoutIntentService(
      createPreparedIntent(),
    ) as unknown as PreparePayoutIntentService,
    new InMemoryPayoutIdempotencyRepository(),
    new StubPayoutSubmissionGateway() as unknown as PayoutSubmissionGateway,
    new InMemoryPayoutWalletRepository(null),
    new InMemoryPayoutWriteRepository(),
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    new StubLedgerPostingService() as unknown as LedgerPostingService,
  );

  await assert.rejects(
    () =>
      service.execute({
        amountMinor: 100_000,
        customerId: 'customer-1',
        idempotencyKey: 'idem-key-2',
        recipientRailId: 'rail-1',
        sourceCurrency: 'USD',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof PayoutSourceWalletNotFoundError,
  );
});

test('execute payout rejects when available balance cannot cover fee-inclusive amount', async () => {
  const payoutWalletRepository = new InMemoryPayoutWalletRepository({
    availableAmountMinor: 100_000,
    walletId: 'wallet-1',
  });
  const service = new ExecutePayoutService(
    new ImmediateTransactionManager(),
    new StubPreparePayoutIntentService(
      createPreparedIntent(),
    ) as unknown as PreparePayoutIntentService,
    new InMemoryPayoutIdempotencyRepository(),
    new StubPayoutSubmissionGateway() as unknown as PayoutSubmissionGateway,
    payoutWalletRepository,
    new InMemoryPayoutWriteRepository(),
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    new StubLedgerPostingService() as unknown as LedgerPostingService,
  );

  await assert.rejects(
    () =>
      service.execute({
        amountMinor: 100_000,
        customerId: 'customer-1',
        idempotencyKey: 'idem-key-3',
        recipientRailId: 'rail-1',
        sourceCurrency: 'USD',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof InsufficientWalletBalanceError,
  );
  assert.equal(payoutWalletRepository.debitCalls.length, 0);
});

test('execute payout returns the stored response for a completed idempotent replay', async () => {
  const existingResponse = createCompletedPayoutResponse();
  const service = new ExecutePayoutService(
    new ImmediateTransactionManager(),
    new StubPreparePayoutIntentService(
      createPreparedIntent(),
    ) as unknown as PreparePayoutIntentService,
    new InMemoryPayoutIdempotencyRepository({
      id: 'idem-1',
      requestFingerprint: null,
      responsePayload: existingResponse,
      result: 'existing',
      status: 'completed',
    }),
    new StubPayoutSubmissionGateway() as unknown as PayoutSubmissionGateway,
    new InMemoryPayoutWalletRepository({
      availableAmountMinor: 200_000,
      walletId: 'wallet-1',
    }),
    new InMemoryPayoutWriteRepository(),
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    new StubLedgerPostingService() as unknown as LedgerPostingService,
  );

  const result = await service.execute({
    amountMinor: 100_000,
    customerId: 'customer-1',
    idempotencyKey: 'idem-key-1',
    recipientRailId: 'rail-1',
    reference: 'Invoice 1042',
    sourceCurrency: 'USD',
    sourceWalletId: 'wallet-1',
  });

  assert.deepEqual(result, existingResponse);
});

test('execute payout rejects idempotency key reuse with a different request fingerprint', async () => {
  const service = new ExecutePayoutService(
    new ImmediateTransactionManager(),
    new StubPreparePayoutIntentService(
      createPreparedIntent(),
    ) as unknown as PreparePayoutIntentService,
    new InMemoryPayoutIdempotencyRepository({
      id: 'idem-1',
      requestFingerprint: 'sha256:different',
      responsePayload: null,
      result: 'existing',
      status: 'completed',
    }),
    new StubPayoutSubmissionGateway() as unknown as PayoutSubmissionGateway,
    new InMemoryPayoutWalletRepository({
      availableAmountMinor: 200_000,
      walletId: 'wallet-1',
    }),
    new InMemoryPayoutWriteRepository(),
    new StubLedgerAccountService() as unknown as LedgerAccountService,
    new StubLedgerPostingService() as unknown as LedgerPostingService,
  );

  await assert.rejects(
    () =>
      service.execute({
        amountMinor: 100_000,
        customerId: 'customer-1',
        idempotencyKey: 'idem-key-1',
        recipientRailId: 'rail-1',
        reference: 'Invoice 1042',
        sourceCurrency: 'USD',
        sourceWalletId: 'wallet-1',
      }),
    (error: unknown) => error instanceof PayoutIdempotencyConflictError,
  );
});

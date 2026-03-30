import assert from 'node:assert/strict';
import test from 'node:test';

import { TransactionContext } from '../../shared/application/transaction-manager';
import {
  type ReconciliationReportStore,
  type StoredReconciliationBatch,
} from '../domain/reconciliation-report.store';
import {
  type FundingReconciliationMatchCandidate,
  type PayoutReconciliationMatchCandidate,
  type ReconciliationLineOutcome,
  type RecordedReconciliationReportEvent,
  type StoredReconciliationReportLine,
} from '../domain/reconciliation-report.types';
import { ReconciliationLineClassifierService } from './reconciliation-line-classifier.service';

class FakeReconciliationReportStore implements ReconciliationReportStore {
  exceptions: Array<{ lineId: string; outcome: ReconciliationLineOutcome; severity: string }> = [];
  fundingCandidate: FundingReconciliationMatchCandidate | null = null;
  lines: StoredReconciliationReportLine[] = [];
  payoutCandidate: PayoutReconciliationMatchCandidate | null = null;
  updatedOutcomes = new Map<string, ReconciliationLineOutcome>();

  async deleteExceptionForLine(_context: TransactionContext, lineId: string): Promise<void> {
    this.exceptions = this.exceptions.filter((item) => item.lineId !== lineId);
  }

  async findBatchByProviderReportId(): Promise<StoredReconciliationBatch | null> {
    return null;
  }

  async findByProviderEvent(): Promise<RecordedReconciliationReportEvent | null> {
    return null;
  }

  async findDuplicateProviderLine(): Promise<{ batchId: string; lineId: string } | null> {
    return null;
  }

  async findFundingMatchCandidate(): Promise<FundingReconciliationMatchCandidate | null> {
    return this.fundingCandidate;
  }

  async findPayoutMatchCandidate(): Promise<PayoutReconciliationMatchCandidate | null> {
    return this.payoutCandidate;
  }

  async listBatchLines(): Promise<StoredReconciliationReportLine[]> {
    return this.lines;
  }

  async markBatchAndLinesProcessed(): Promise<void> {}

  async markWebhookProcessingStatus(): Promise<RecordedReconciliationReportEvent> {
    throw new Error('Not implemented in classifier spec');
  }

  async recordBatch(): Promise<StoredReconciliationBatch | null> {
    return null;
  }

  async recordLines(): Promise<void> {}

  async recordReceivedWebhook(): Promise<RecordedReconciliationReportEvent | null> {
    return null;
  }

  async updateLineClassification(
    _context: TransactionContext,
    input: { lineId: string; outcome: ReconciliationLineOutcome },
  ): Promise<void> {
    this.updatedOutcomes.set(input.lineId, input.outcome);
  }

  async upsertException(
    _context: TransactionContext,
    input: { lineId: string; outcome: ReconciliationLineOutcome; severity: 'high' | 'medium' },
  ): Promise<void> {
    this.exceptions.push(input);
  }
}

const context = new (class extends TransactionContext {})();

function createFundingLine(): StoredReconciliationReportLine {
  return {
    batchId: 'batch_001',
    currency: 'USD',
    customerExternalRef: 'user_demo_alice',
    eventTimestamp: '2026-03-29T08:00:00.000Z',
    externalEventId: 'evt_funding_001',
    externalPayoutId: null,
    externalRequestId: null,
    feeAmountMinor: 0,
    grossAmountMinor: 2500,
    id: 'line_funding_001',
    internalReference: 'funding-evt_funding_001',
    lineIndex: 0,
    lineStatus: 'completed',
    lineType: 'funding',
    netAmountMinor: 2500,
    payoutId: null,
    providerLineId: 'funding:txn_001',
    returnedAmountMinor: null,
    walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  };
}

function createPayoutLine(status: string): StoredReconciliationReportLine {
  return {
    batchId: 'batch_001',
    currency: 'USD',
    customerExternalRef: 'user_demo_alice',
    eventTimestamp: '2026-03-29T12:00:00.000Z',
    externalEventId: null,
    externalPayoutId: 'ppay_001',
    externalRequestId: 'preq_001',
    feeAmountMinor: 3,
    grossAmountMinor: 2503,
    id: `line_${status}_001`,
    internalReference: 'Invoice 208',
    lineIndex: 1,
    lineStatus: status,
    lineType: status === 'returned' ? 'return' : 'payout',
    netAmountMinor: 2500,
    payoutId: 'payout_001',
    providerLineId: `${status}:payout_001`,
    returnedAmountMinor: status === 'returned' ? 2503 : null,
    walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
  };
}

test('classifier marks exact funding matches as matched without exceptions', async () => {
  const store = new FakeReconciliationReportStore();
  store.lines = [createFundingLine()];
  store.fundingCandidate = {
    currency: 'USD',
    feeAmountMinor: 0,
    grossAmountMinor: 2500,
    ledgerTransactionId: 'ledger_funding_001',
    ledgerTransactionStatus: 'posted',
    netAmountMinor: 2500,
    userTransactionId: 'txn_funding_001',
    userTransactionStatus: 'completed',
    webhookEventId: 'webhook_funding_001',
    webhookProcessingStatus: 'processed',
  };
  const service = new ReconciliationLineClassifierService(store as never);

  await service.classifyBatch(context, 'batch_001', 'psp_sandbox', '2026-03-30T00:05:00.000Z');

  assert.equal(store.updatedOutcomes.get('line_funding_001'), 'matched');
  assert.equal(store.exceptions.length, 0);
});

test('classifier marks missing payouts as provider_only', async () => {
  const store = new FakeReconciliationReportStore();
  store.lines = [createPayoutLine('paid')];
  const service = new ReconciliationLineClassifierService(store as never);

  await service.classifyBatch(context, 'batch_001', 'psp_sandbox', '2026-03-30T00:05:00.000Z');

  assert.equal(store.updatedOutcomes.get('line_paid_001'), 'provider_only');
  assert.equal(store.exceptions[0]?.severity, 'high');
});

test('classifier marks paid provider lines against in-flight payouts as timing_difference', async () => {
  const store = new FakeReconciliationReportStore();
  store.lines = [createPayoutLine('paid')];
  store.payoutCandidate = {
    attemptStatus: 'processing',
    currency: 'USD',
    feeAmountMinor: 3,
    grossAmountMinor: 2503,
    netAmountMinor: 2500,
    payoutAttemptId: 'attempt_001',
    payoutId: 'payout_001',
    payoutStatus: 'processing',
    returnCreditTransactionId: null,
    returnedAmountMinor: null,
    reversalLedgerTransactionId: null,
    settlementLedgerTransactionId: null,
    userTransactionId: 'txn_payout_001',
    webhookEventId: 'webhook_payout_001',
  };
  const service = new ReconciliationLineClassifierService(store as never);

  await service.classifyBatch(context, 'batch_001', 'psp_sandbox', '2026-03-30T00:05:00.000Z');

  assert.equal(store.updatedOutcomes.get('line_paid_001'), 'timing_difference');
  assert.equal(store.exceptions[0]?.severity, 'medium');
});

test('classifier marks returned payouts without reversal follow-up as status_mismatch', async () => {
  const store = new FakeReconciliationReportStore();
  store.lines = [createPayoutLine('returned')];
  store.payoutCandidate = {
    attemptStatus: 'succeeded',
    currency: 'USD',
    feeAmountMinor: 3,
    grossAmountMinor: 2503,
    netAmountMinor: 2500,
    payoutAttemptId: 'attempt_001',
    payoutId: 'payout_001',
    payoutStatus: 'returned',
    returnCreditTransactionId: null,
    returnedAmountMinor: 2503,
    reversalLedgerTransactionId: null,
    settlementLedgerTransactionId: 'ledger_settlement_001',
    userTransactionId: 'txn_payout_001',
    webhookEventId: 'webhook_payout_001',
  };
  const service = new ReconciliationLineClassifierService(store as never);

  await service.classifyBatch(context, 'batch_001', 'psp_sandbox', '2026-03-30T00:05:00.000Z');

  assert.equal(store.updatedOutcomes.get('line_returned_001'), 'status_mismatch');
  assert.equal(store.exceptions[0]?.severity, 'high');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TransactionContext,
  type TransactionManager,
} from '../../shared/application/transaction-manager';
import {
  type ReconciliationReportStore,
  type StoredReconciliationBatch,
} from '../domain/reconciliation-report.store';
import {
  type FundingReconciliationMatchCandidate,
  type PayoutReconciliationMatchCandidate,
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
  type StoredReconciliationReportLine,
} from '../domain/reconciliation-report.types';
import { ApplyReconciliationReportService } from './apply-reconciliation-report.service';
import { ReconciliationLineClassifierService } from './reconciliation-line-classifier.service';

class FakeTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return await operation(new (class extends TransactionContext {})());
  }
}

class FakeReconciliationReportStore implements ReconciliationReportStore {
  classifications = 0;
  exceptions = 0;
  lineRows: StoredReconciliationReportLine[] = [];
  recordedWebhooks = 0;
  recordedLines = 0;
  processedBatches: string[] = [];
  webhookEvents = new Map<string, RecordedReconciliationReportEvent>();
  batches = new Map<string, StoredReconciliationBatch>();
  duplicateByEvent = false;

  async deleteExceptionForLine(): Promise<void> {}

  async recordReceivedWebhook(
    _context: TransactionContext,
    payload: ReconciliationReportWebhook,
    webhookId: string,
    receivedAt: string,
  ): Promise<RecordedReconciliationReportEvent | null> {
    if (this.duplicateByEvent) {
      return null;
    }

    const event: RecordedReconciliationReportEvent = {
      batchId: null,
      duplicate: false,
      eventType: payload.eventType,
      externalEventId: payload.externalEventId,
      id: webhookId,
      processingStatus: 'received',
      provider: payload.provider,
      providerReportId: payload.data.providerReportId,
      receivedAt,
    };
    this.webhookEvents.set(`${payload.provider}:${payload.externalEventId}`, event);
    this.recordedWebhooks += 1;

    return event;
  }

  async findByProviderEvent(
    _context: TransactionContext,
    provider: string,
    externalEventId: string,
  ): Promise<RecordedReconciliationReportEvent | null> {
    return this.webhookEvents.get(`${provider}:${externalEventId}`) ?? null;
  }

  async findDuplicateProviderLine(): Promise<{ batchId: string; lineId: string } | null> {
    return null;
  }

  async findFundingMatchCandidate(): Promise<FundingReconciliationMatchCandidate | null> {
    return {
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
  }

  async findPayoutMatchCandidate(): Promise<PayoutReconciliationMatchCandidate | null> {
    return {
      attemptStatus: 'succeeded',
      currency: 'USD',
      feeAmountMinor: 3,
      grossAmountMinor: 2503,
      netAmountMinor: 2500,
      payoutAttemptId: 'attempt_001',
      payoutId: 'payout_001',
      payoutStatus: 'paid',
      returnCreditTransactionId: null,
      returnedAmountMinor: null,
      reversalLedgerTransactionId: null,
      settlementLedgerTransactionId: 'ledger_payout_001',
      userTransactionId: 'txn_payout_001',
      webhookEventId: 'webhook_payout_001',
    };
  }

  async listBatchLines(
    _context: TransactionContext,
    batchId: string,
  ): Promise<StoredReconciliationReportLine[]> {
    return this.lineRows.filter((line) => line.batchId === batchId);
  }

  async recordBatch(
    _context: TransactionContext,
    input: {
      batchId: string;
      lineCount: number;
      payload: ReconciliationReportWebhook;
      providerReportId: string;
      receivedAt: string;
      reportDate: string;
      reportWindowEnd: string;
      reportWindowStart: string;
      webhookEventId: string;
    },
  ): Promise<StoredReconciliationBatch | null> {
    const key = `${input.payload.provider}:${input.providerReportId}`;

    if (this.batches.has(key)) {
      return null;
    }

    const batch = {
      id: input.batchId,
      provider: input.payload.provider,
      providerReportId: input.providerReportId,
      receivedAt: input.receivedAt,
    };
    this.batches.set(key, batch);

    return batch;
  }

  async findBatchByProviderReportId(
    _context: TransactionContext,
    provider: string,
    providerReportId: string,
  ): Promise<StoredReconciliationBatch | null> {
    return this.batches.get(`${provider}:${providerReportId}`) ?? null;
  }

  async recordLines(
    _context: TransactionContext,
    batchId: string,
    lines: ReconciliationReportWebhook['data']['lines'],
  ): Promise<void> {
    this.recordedLines += lines.length;
    this.lineRows = lines.map((line, index) => ({
      batchId,
      currency: line.currency,
      customerExternalRef: line.customerExternalRef,
      eventTimestamp: line.eventTimestamp,
      externalEventId: line.lineType === 'funding' ? line.externalEventId : null,
      externalPayoutId: line.lineType !== 'funding' ? line.externalPayoutId : null,
      externalRequestId: line.lineType !== 'funding' ? line.externalRequestId : null,
      feeAmountMinor: line.feeAmountMinor,
      grossAmountMinor: line.grossAmountMinor,
      id: `line_${index + 1}`,
      internalReference: line.internalReference,
      lineIndex: index,
      lineStatus: line.status,
      lineType: line.lineType,
      netAmountMinor: line.netAmountMinor,
      payoutId: line.lineType === 'funding' ? null : line.payoutId,
      providerLineId: line.lineId,
      returnedAmountMinor: line.lineType === 'return' ? line.returnedAmountMinor : null,
      walletId: line.walletId,
    }));
  }

  async markBatchAndLinesProcessed(_context: TransactionContext, batchId: string): Promise<void> {
    this.processedBatches.push(batchId);
  }

  async markWebhookProcessingStatus(
    _context: TransactionContext,
    webhookId: string,
    processingStatus: 'failed' | 'processed',
  ): Promise<RecordedReconciliationReportEvent> {
    return {
      batchId: null,
      duplicate: false,
      eventType: 'reconciliation.report.generated',
      externalEventId: 'evt_reconciliation_001',
      id: webhookId,
      processingStatus,
      provider: 'psp_sandbox',
      providerReportId: null,
      receivedAt: '2026-03-30T08:00:00.000Z',
    };
  }

  async upsertException(): Promise<void> {
    this.exceptions += 1;
  }

  async updateLineClassification(): Promise<void> {
    this.classifications += 1;
  }
}

function createWebhookPayload(): ReconciliationReportWebhook {
  return {
    data: {
      lineCount: 2,
      lines: [
        {
          currency: 'USD',
          customerExternalRef: 'user_demo_alice',
          eventTimestamp: '2026-03-29T08:00:00.000Z',
          externalEventId: 'evt_funding_001',
          feeAmountMinor: 0,
          grossAmountMinor: 2500,
          internalReference: 'funding-evt_funding_001',
          lineId: 'funding:txn_001',
          lineType: 'funding',
          netAmountMinor: 2500,
          providerReference: 'bank-ref-001',
          status: 'completed',
          walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        },
        {
          currency: 'USD',
          customerExternalRef: 'user_demo_alice',
          eventTimestamp: '2026-03-29T12:00:00.000Z',
          externalPayoutId: 'ppay_001',
          externalRequestId: 'preq_001',
          feeAmountMinor: 3,
          grossAmountMinor: 2503,
          internalReference: 'Invoice 208',
          lineId: 'payout:payout_001',
          lineType: 'payout',
          netAmountMinor: 2500,
          payoutId: 'payout_001',
          recipientName: 'Big City Boi',
          status: 'paid',
          walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        },
      ],
      providerReportId: 'rpt_20260329_psp_sandbox',
      reportDate: '2026-03-29',
      reportWindowEnd: '2026-03-30T00:00:00.000Z',
      reportWindowStart: '2026-03-29T00:00:00.000Z',
    },
    eventType: 'reconciliation.report.generated',
    externalEventId: 'evt_reconciliation_001',
    occurredAt: '2026-03-30T00:05:00.000Z',
    provider: 'psp_sandbox',
  };
}

test('apply reconciliation report stores webhook, batch, and normalized lines', async () => {
  const store = new FakeReconciliationReportStore();
  const classifier = new ReconciliationLineClassifierService(store as never);
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
    classifier,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.duplicate, false);
  assert.equal(result.providerReportId, 'rpt_20260329_psp_sandbox');
  assert.equal(store.recordedWebhooks, 1);
  assert.equal(store.recordedLines, 2);
  assert.equal(store.classifications, 2);
  assert.equal(store.processedBatches.length, 1);
});

test('apply reconciliation report deduplicates repeated provider report ids', async () => {
  const store = new FakeReconciliationReportStore();
  const classifier = new ReconciliationLineClassifierService(store as never);
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
    classifier,
  );
  const payload = createWebhookPayload();

  await service.execute(payload);
  const replayPayload = {
    ...payload,
    externalEventId: 'evt_reconciliation_002',
  };

  const result = await service.execute(replayPayload);

  assert.equal(result.duplicate, true);
  assert.equal(store.recordedLines, 2);
  assert.equal(store.processedBatches.length, 1);
});

test('apply reconciliation report deduplicates repeated provider event ids', async () => {
  const store = new FakeReconciliationReportStore();
  const classifier = new ReconciliationLineClassifierService(store as never);
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
    classifier,
  );
  const payload = createWebhookPayload();

  await service.execute(payload);
  store.duplicateByEvent = true;

  const result = await service.execute(payload);

  assert.equal(result.duplicate, true);
  assert.equal(result.externalEventId, payload.externalEventId);
  assert.equal(store.recordedWebhooks, 1);
  assert.equal(store.recordedLines, 2);
  assert.equal(store.processedBatches.length, 1);
});

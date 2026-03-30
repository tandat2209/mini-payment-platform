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
  type ReconciliationReportWebhook,
  type RecordedReconciliationReportEvent,
} from '../domain/reconciliation-report.types';
import { ApplyReconciliationReportService } from './apply-reconciliation-report.service';

class FakeTransactionManager implements TransactionManager {
  async runInTransaction<T>(operation: (context: TransactionContext) => Promise<T>): Promise<T> {
    return await operation(new (class extends TransactionContext {})());
  }
}

class FakeReconciliationReportStore implements ReconciliationReportStore {
  recordedWebhooks = 0;
  recordedLines = 0;
  processedBatches: string[] = [];
  webhookEvents = new Map<string, RecordedReconciliationReportEvent>();
  batches = new Map<string, StoredReconciliationBatch>();
  duplicateByEvent = false;

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
    _batchId: string,
    lines: ReconciliationReportWebhook['data']['lines'],
  ): Promise<void> {
    this.recordedLines += lines.length;
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
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
  );

  const result = await service.execute(createWebhookPayload());

  assert.equal(result.duplicate, false);
  assert.equal(result.providerReportId, 'rpt_20260329_psp_sandbox');
  assert.equal(store.recordedWebhooks, 1);
  assert.equal(store.recordedLines, 2);
  assert.equal(store.processedBatches.length, 1);
});

test('apply reconciliation report deduplicates repeated provider report ids', async () => {
  const store = new FakeReconciliationReportStore();
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
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
  const service = new ApplyReconciliationReportService(
    new FakeTransactionManager(),
    store as never,
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

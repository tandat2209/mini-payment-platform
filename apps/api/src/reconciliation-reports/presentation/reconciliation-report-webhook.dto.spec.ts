import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { ReconciliationReportWebhookRequestDto } from './reconciliation-report-webhook.dto';

function createRequestDto(): ReconciliationReportWebhookRequestDto {
  return plainToInstance(ReconciliationReportWebhookRequestDto, {
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
  });
}

test('reconciliation report dto maps a valid report into the domain payload', () => {
  const dto = createRequestDto();

  const result = dto.toDomain();

  assert.equal(result.data.lineCount, 2);
  assert.equal(result.data.lines[0]?.lineType, 'funding');
  assert.equal(result.data.lines[1]?.lineType, 'payout');
});

test('reconciliation report dto rejects lineCount mismatches', () => {
  const dto = createRequestDto();
  dto.data.lineCount = 3;

  assert.throws(() => dto.toDomain(), {
    message: 'lineCount must match the number of report lines',
    name: BadRequestException.name,
  });
});

test('reconciliation report dto rejects invalid payout line statuses', () => {
  const dto = createRequestDto();
  dto.data.lines[1] = plainToInstance(Object.getPrototypeOf(dto.data.lines[1]).constructor, {
    ...dto.data.lines[1],
    status: 'completed',
  }) as (typeof dto.data.lines)[number];

  assert.throws(() => dto.toDomain(), {
    message: 'payout report lines must carry a supported payout status',
    name: BadRequestException.name,
  });
});

test('reconciliation report dto requires returned amount for return lines', () => {
  const dto = createRequestDto();
  dto.data.lineCount = 1;
  dto.data.lines = [
    plainToInstance(Object.getPrototypeOf(dto.data.lines[0]).constructor, {
      currency: 'USD',
      customerExternalRef: 'user_demo_alice',
      eventTimestamp: '2026-03-30T08:00:00.000Z',
      externalPayoutId: 'ppay_001',
      externalRequestId: 'preq_001',
      feeAmountMinor: 3,
      grossAmountMinor: 2503,
      internalReference: 'Invoice 208',
      lineId: 'return:payout_001',
      lineType: 'return',
      netAmountMinor: 2500,
      payoutId: 'payout_001',
      status: 'returned',
      walletId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    }) as (typeof dto.data.lines)[number],
  ];

  assert.throws(() => dto.toDomain(), {
    message: 'return report lines require returnedAmountMinor',
    name: BadRequestException.name,
  });
});

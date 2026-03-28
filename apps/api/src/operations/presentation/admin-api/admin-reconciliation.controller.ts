import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetAdminOperationsQuery } from '../../application/get-admin-operations.query';

@Controller('admin/reconciliation')
export class AdminReconciliationController {
  constructor(private readonly getAdminOperationsQuery: GetAdminOperationsQuery) {}

  @Get('exceptions')
  async listExceptions(): Promise<{
    items: Array<{
      kind: string;
      linkedLedgerTransactionId: string | null;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      linkedWebhookEventId: string | null;
      occurredAt: string | null;
      reference: string | null;
      severity: string;
      sourceId: string;
      summary: string;
    }>;
  }> {
    const items = await this.getAdminOperationsQuery.listReconciliationExceptions();

    return {
      items: items.map((item) => ({
        kind: item.kind,
        linkedLedgerTransactionId: item.linkedLedgerTransactionId,
        linkedPayoutId: item.linkedPayoutId,
        linkedTransactionId: item.linkedTransactionId,
        linkedWebhookEventId: item.linkedWebhookEventId,
        occurredAt: toIsoTimestamp(item.occurredAt),
        reference: item.reference,
        severity: item.severity,
        sourceId: item.sourceId,
        summary: item.summary,
      })),
    };
  }
}

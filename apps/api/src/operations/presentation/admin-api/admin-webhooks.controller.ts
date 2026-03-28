import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetAdminOperationsQuery } from '../../application/get-admin-operations.query';

@Controller('admin/webhooks')
export class AdminWebhooksController {
  constructor(private readonly getAdminOperationsQuery: GetAdminOperationsQuery) {}

  @Get()
  async listWebhookEvents(): Promise<{
    items: Array<{
      eventType: string;
      externalEventId: string;
      id: string;
      linkedPayoutId: string | null;
      linkedTransactionId: string | null;
      payload: Record<string, unknown>;
      processingStatus: string;
      processedAt: string | null;
      provider: string;
      receivedAt: string | null;
    }>;
  }> {
    const items = await this.getAdminOperationsQuery.listWebhookEvents();

    return {
      items: items.map((item) => ({
        eventType: item.eventType,
        externalEventId: item.externalEventId,
        id: item.id,
        linkedPayoutId: item.linkedPayoutId,
        linkedTransactionId: item.linkedTransactionId,
        payload: item.payload,
        processingStatus: item.processingStatus,
        processedAt: toIsoTimestamp(item.processedAt),
        provider: item.provider,
        receivedAt: toIsoTimestamp(item.receivedAt),
      })),
    };
  }
}

import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp, toMoneyDto } from '../../../shared/api/api-primitives';
import { GetAdminPayoutsQuery } from '../../application/get-admin-payouts.query';

@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly getAdminPayoutsQuery: GetAdminPayoutsQuery) {}

  @Get()
  async listPayouts(): Promise<{
    items: Array<{
      amounts: {
        fee: ReturnType<typeof toMoneyDto>;
        gross: ReturnType<typeof toMoneyDto>;
      };
      attemptStatus: string | null;
      completedAt: string | null;
      createdAt: string | null;
      currency: string;
      customer: {
        externalRef: string;
        id: string;
      };
      externalPayoutId: string | null;
      externalRequestId: string | null;
      failedAt: string | null;
      id: string;
      latestWebhookEventId: string | null;
      provider: string | null;
      recipient: {
        id: string;
        name: string;
      };
      reference: string | null;
      returnedAmount: ReturnType<typeof toMoneyDto> | null;
      returnedAt: string | null;
      status: string;
      submittedAt: string | null;
      userTransactionId: string;
      walletId: string;
      walletRestoredAmount: ReturnType<typeof toMoneyDto> | null;
    }>;
  }> {
    const items = await this.getAdminPayoutsQuery.list();

    return {
      items: items.map((item) => ({
        amounts: {
          fee: toMoneyDto(item.currency, item.feeAmountMinor),
          gross: toMoneyDto(item.currency, item.grossAmountMinor),
        },
        attemptStatus: item.attemptStatus,
        completedAt: toIsoTimestamp(item.completedAt),
        createdAt: toIsoTimestamp(item.createdAt),
        currency: item.currency,
        customer: {
          externalRef: item.customerExternalRef,
          id: item.customerId,
        },
        externalPayoutId: item.externalPayoutId,
        externalRequestId: item.externalRequestId,
        failedAt: toIsoTimestamp(item.failedAt),
        id: item.id,
        latestWebhookEventId: item.latestWebhookEventId,
        provider: item.provider,
        recipient: {
          id: item.recipientId,
          name: item.recipientName,
        },
        reference: item.reference,
        returnedAmount: item.returnedAmountMinor
          ? toMoneyDto(item.currency, item.returnedAmountMinor)
          : null,
        returnedAt: toIsoTimestamp(item.returnedAt),
        status: item.status,
        submittedAt: toIsoTimestamp(item.submittedAt),
        userTransactionId: item.userTransactionId,
        walletId: item.walletId,
        walletRestoredAmount: item.walletRestoredAmountMinor
          ? toMoneyDto(item.currency, item.walletRestoredAmountMinor)
          : null,
      })),
    };
  }
}

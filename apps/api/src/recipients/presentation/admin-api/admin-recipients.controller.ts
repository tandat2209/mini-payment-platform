import { Controller, Get } from '@nestjs/common';

import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetAdminRecipientsQuery } from '../../application/queries/get-admin-recipients.query';

@Controller('admin/recipients')
export class AdminRecipientsController {
  constructor(private readonly getAdminRecipientsQuery: GetAdminRecipientsQuery) {}

  @Get()
  async listRecipients(): Promise<{
    items: Array<{
      createdAt: string | null;
      customer: {
        externalRef: string;
        id: string;
      };
      id: string;
      name: string;
      rails: Array<{
        countryCode: string;
        currency: string | null;
        id: string;
        payoutReady: boolean;
        providerRegistrationError: string | null;
        rail: string;
        readinessStatus: string;
      }>;
      status: string;
    }>;
  }> {
    const items = await this.getAdminRecipientsQuery.list();

    return {
      items: items.map((item) => ({
        createdAt: toIsoTimestamp(item.createdAt),
        customer: {
          externalRef: item.customerExternalRef,
          id: item.customerId,
        },
        id: item.id,
        name: item.name,
        rails: item.rails,
        status: item.status,
      })),
    };
  }
}

import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';

import { CurrentCustomer } from '../../../access/customer/current-customer.decorator';
import { CurrentCustomerGuard } from '../../../access/customer/current-customer.guard';
import { type CurrentCustomer as CurrentCustomerView } from '../../../access/customer/current-customer.types';
import { toIsoTimestamp } from '../../../shared/api/api-primitives';
import { GetRecipientsQuery } from '../../application/queries/get-recipients.query';
import {
  type RecipientDetailView,
  type RecipientListItemView,
} from '../../domain/recipient-query.repository';

type RecipientListResponse = {
  createdAt: string | null;
  id: string;
  name: string;
  rails: Array<{
    currency: string | null;
    id: string;
    isDefault: boolean;
    rail: string;
  }>;
  status: string;
};

type RecipientDetailResponse = RecipientListResponse & {
  rails: Array<{
    currency: string | null;
    details: Record<string, string>;
    id: string;
    isDefault: boolean;
    rail: string;
  }>;
};

@UseGuards(CurrentCustomerGuard)
@Controller('customers/me/recipients')
export class RecipientsController {
  constructor(private readonly getRecipientsQuery: GetRecipientsQuery) {}

  @Get()
  async listRecipients(
    @CurrentCustomer() customer: CurrentCustomerView,
  ): Promise<{ items: RecipientListResponse[] }> {
    const recipients = await this.getRecipientsQuery.list(customer);

    return {
      items: recipients.map((recipient) => this.toListResponse(recipient)),
    };
  }

  @Get(':recipientId')
  async getRecipientDetail(
    @CurrentCustomer() customer: CurrentCustomerView,
    @Param('recipientId') recipientId: string,
  ): Promise<RecipientDetailResponse> {
    const recipient = await this.getRecipientsQuery.getDetail(customer, recipientId);

    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    return this.toDetailResponse(recipient);
  }

  private toListResponse(recipient: RecipientListItemView): RecipientListResponse {
    return {
      createdAt: toIsoTimestamp(recipient.createdAt),
      id: recipient.id,
      name: recipient.name,
      rails: recipient.rails.map((rail) => ({
        currency: rail.currency,
        id: rail.id,
        isDefault: rail.isDefault,
        rail: rail.rail,
      })),
      status: recipient.status,
    };
  }

  private toDetailResponse(recipient: RecipientDetailView): RecipientDetailResponse {
    return {
      createdAt: toIsoTimestamp(recipient.createdAt),
      id: recipient.id,
      name: recipient.name,
      rails: recipient.rails.map((rail) => ({
        currency: rail.currency,
        details: rail.details,
        id: rail.id,
        isDefault: rail.isDefault,
        rail: rail.rail,
      })),
      status: recipient.status,
    };
  }
}

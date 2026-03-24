import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type RecipientDetailView,
  type RecipientListItemView,
  type RecipientQueryRepository,
  type RecipientRailSummaryView,
} from '../domain/recipient-query.repository';
import { maskRecipientRailDetails } from './recipient-rail-masker';

type RecipientRow = {
  created_at: Date | string;
  id: string;
  name: string;
  status: string;
};

type RecipientRailRow = {
  country_code: string;
  currency: string | null;
  details: Record<string, unknown>;
  id: string;
  is_default: boolean;
  provider_registration_error: string | null;
  provider_registration_strategy: string;
  rail: string;
  readiness_status: string;
  recipient_id: string;
};

@Injectable()
export class SqlRecipientQueryRepository implements RecipientQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listRecipients(customerId: string): Promise<RecipientListItemView[]> {
    const recipients = await this.databaseService.query<RecipientRow>(
      `
        SELECT id, name, status, created_at
        FROM recipients
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
      `,
      [customerId],
    );

    const recipientIds = recipients.rows.map((recipient) => recipient.id);
    const railsByRecipientId =
      recipientIds.length > 0 ? await this.getActiveRailsByRecipientIds(recipientIds) : new Map();

    return recipients.rows.map((recipient) => ({
      createdAt: recipient.created_at,
      id: recipient.id,
      name: recipient.name,
      rails: (railsByRecipientId.get(recipient.id) ?? []).map((rail: RecipientRailSummaryView) => ({
        currency: rail.currency,
        id: rail.id,
        isDefault: rail.isDefault,
        rail: rail.rail,
      })),
      status: recipient.status,
    }));
  }

  async getRecipientDetail(
    customerId: string,
    recipientId: string,
  ): Promise<RecipientDetailView | null> {
    const recipientResult = await this.databaseService.query<RecipientRow>(
      `
        SELECT id, name, status, created_at
        FROM recipients
        WHERE user_id = $1
          AND id = $2
        LIMIT 1
      `,
      [customerId, recipientId],
    );

    const recipient = recipientResult.rows[0];

    if (!recipient) {
      return null;
    }

    const railsResult = await this.databaseService.query<RecipientRailRow>(
      `
        SELECT
          id,
          recipient_id,
          rail,
          currency,
          country_code,
          details,
          readiness_status,
          provider_registration_strategy,
          provider_registration_error,
          is_default
        FROM recipient_rails
        WHERE recipient_id = $1
          AND is_active = TRUE
        ORDER BY is_default DESC, created_at ASC, id ASC
      `,
      [recipient.id],
    );

    return {
      createdAt: recipient.created_at,
      id: recipient.id,
      name: recipient.name,
      rails: railsResult.rows.map((rail) => ({
        countryCode: rail.country_code,
        currency: rail.currency,
        details: maskRecipientRailDetails(rail.details),
        id: rail.id,
        isDefault: rail.is_default,
        payoutReady: rail.readiness_status === 'active',
        providerRegistrationError: rail.provider_registration_error,
        providerRegistrationStrategy: rail.provider_registration_strategy,
        rail: rail.rail,
        readinessStatus: rail.readiness_status,
      })),
      status: recipient.status,
    };
  }

  private async getActiveRailsByRecipientIds(
    recipientIds: string[],
  ): Promise<Map<string, RecipientRailSummaryView[]>> {
    const railsResult = await this.databaseService.query<RecipientRailRow>(
      `
        SELECT
          id,
          recipient_id,
          rail,
          currency,
          country_code,
          details,
          readiness_status,
          provider_registration_strategy,
          provider_registration_error,
          is_default
        FROM recipient_rails
        WHERE recipient_id = ANY($1::uuid[])
          AND is_active = TRUE
        ORDER BY is_default DESC, created_at ASC, id ASC
      `,
      [recipientIds],
    );

    return railsResult.rows.reduce<Map<string, RecipientRailSummaryView[]>>((grouped, rail) => {
      const existing = grouped.get(rail.recipient_id) ?? [];

      existing.push({
        countryCode: rail.country_code,
        currency: rail.currency,
        id: rail.id,
        isDefault: rail.is_default,
        payoutReady: rail.readiness_status === 'active',
        providerRegistrationError: rail.provider_registration_error,
        providerRegistrationStrategy: rail.provider_registration_strategy,
        rail: rail.rail,
        readinessStatus: rail.readiness_status,
      });

      grouped.set(rail.recipient_id, existing);

      return grouped;
    }, new Map<string, RecipientRailSummaryView[]>());
  }
}

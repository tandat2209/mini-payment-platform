import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import {
  type AdminRecipientListItemView,
  type AdminRecipientQueryRepository,
} from '../domain/admin-recipient-query.repository';

type RecipientRow = {
  created_at: Date | string;
  customer_external_ref: string;
  customer_id: string;
  id: string;
  name: string;
  status: string;
};

type RailRow = {
  country_code: string;
  currency: string | null;
  id: string;
  provider_registration_error: string | null;
  rail: string;
  readiness_status: string;
  recipient_id: string;
};

@Injectable()
export class SqlAdminRecipientQueryRepository implements AdminRecipientQueryRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listRecipients(): Promise<AdminRecipientListItemView[]> {
    const recipientsResult = await this.databaseService.query<RecipientRow>(
      `
        SELECT
          r.id,
          r.name,
          r.status,
          r.created_at,
          u.id::text AS customer_id,
          u.external_ref AS customer_external_ref
        FROM recipients r
        JOIN users u
          ON u.id = r.user_id
        ORDER BY r.created_at DESC, r.id DESC
      `,
    );

    const recipientIds = recipientsResult.rows.map((row) => row.id);
    const railsResult =
      recipientIds.length === 0
        ? { rows: [] as RailRow[] }
        : await this.databaseService.query<RailRow>(
            `
              SELECT
                rr.id,
                rr.recipient_id,
                rr.rail,
                rr.currency,
                rr.country_code,
                rr.readiness_status,
                rr.provider_registration_error
              FROM recipient_rails rr
              WHERE rr.recipient_id = ANY($1::uuid[])
                AND rr.is_active = TRUE
              ORDER BY rr.created_at ASC, rr.id ASC
            `,
            [recipientIds],
          );

    const railsByRecipient = railsResult.rows.reduce<
      Map<string, AdminRecipientListItemView['rails']>
    >((grouped, row) => {
      const existing = grouped.get(row.recipient_id) ?? [];
      existing.push({
        countryCode: row.country_code,
        currency: row.currency,
        id: row.id,
        payoutReady: row.readiness_status === 'active',
        providerRegistrationError: row.provider_registration_error,
        rail: row.rail,
        readinessStatus: row.readiness_status,
      });
      grouped.set(row.recipient_id, existing);
      return grouped;
    }, new Map());

    return recipientsResult.rows.map((row) => ({
      createdAt: row.created_at,
      customerExternalRef: row.customer_external_ref,
      customerId: row.customer_id,
      id: row.id,
      name: row.name,
      rails: railsByRecipient.get(row.id) ?? [],
      status: row.status,
    }));
  }
}

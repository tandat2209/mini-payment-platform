import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import type {
  PayoutRecipientRailRepository,
  PayoutRecipientRailTarget,
} from '../domain/payout-recipient-rail.repository';

type PayoutRecipientRailRow = {
  currency: string | null;
  details: Record<string, string>;
  is_active: boolean;
  provider_reference: string | null;
  provider_registration_strategy: 'platform_managed' | 'provider_managed';
  rail: 'ach' | 'sepa' | 'swift';
  readiness_status: 'draft' | 'pending_provider_registration' | 'active' | 'failed' | 'archived';
  recipient_id: string;
  recipient_name: string;
  recipient_rail_id: string;
  recipient_status: string;
};

@Injectable()
export class SqlPayoutRecipientRailRepository implements PayoutRecipientRailRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findOwnedRecipientRail(
    customerId: string,
    recipientRailId: string,
  ): Promise<PayoutRecipientRailTarget | null> {
    const result = await this.databaseService.query<PayoutRecipientRailRow>(
      `
        SELECT
          rr.id AS recipient_rail_id,
          rr.rail,
          rr.currency,
          rr.details,
          rr.is_active,
          rr.readiness_status,
          rr.provider_registration_strategy,
          rr.provider_reference,
          r.id AS recipient_id,
          r.name AS recipient_name,
          r.status AS recipient_status
        FROM recipient_rails rr
        INNER JOIN recipients r
          ON r.id = rr.recipient_id
        WHERE rr.id = $1::uuid
          AND r.user_id = $2::uuid
        LIMIT 1
      `,
      [recipientRailId, customerId],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      currency: row.currency,
      details: row.details,
      isActive: row.is_active,
      providerReference: row.provider_reference,
      providerRegistrationStrategy: row.provider_registration_strategy,
      rail: row.rail,
      readinessStatus: row.readiness_status,
      recipientId: row.recipient_id,
      recipientName: row.recipient_name,
      recipientRailId: row.recipient_rail_id,
      recipientStatus: row.recipient_status,
    };
  }
}

import { Injectable } from '@nestjs/common';

import { getDatabaseQueryable } from '../../database/database-transaction-manager';
import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type RecipientIdentity,
  type RecipientProviderRegistrationStrategy,
  type RecipientRailReadinessStatus,
  type RecipientRailRecord,
} from '../domain/recipient-onboarding.types';
import {
  type CreateRecipientInput,
  type CreateRecipientRailInput,
  type RecipientWriteRepository,
} from '../domain/recipient-write.repository';

type RecipientRow = {
  id: string;
  name: string;
  status: string;
  user_id: string;
};

type RecipientRailRow = {
  country_code: string;
  created_at: Date | string;
  currency: string;
  details: Record<string, string>;
  id: string;
  is_active: boolean;
  is_default: boolean;
  provider_reference: string | null;
  provider_registered_at: Date | string | null;
  provider_registration_error: string | null;
  provider_registration_strategy: RecipientProviderRegistrationStrategy;
  rail: string;
  readiness_status: RecipientRailReadinessStatus;
  recipient_id: string;
  updated_at: Date | string;
};

@Injectable()
export class SqlRecipientWriteRepository implements RecipientWriteRepository {
  async createRecipient(
    context: TransactionContext,
    input: CreateRecipientInput,
  ): Promise<RecipientIdentity> {
    const queryable = getDatabaseQueryable(context);
    const result = await queryable.query<RecipientRow>(
      `
        INSERT INTO recipients (
          id,
          user_id,
          name,
          status,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          'active',
          $4::timestamptz,
          $5::timestamptz
        )
        RETURNING id, user_id, name, status
      `,
      [input.id, input.userId, input.name, input.createdAt, input.updatedAt],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error('Recipient insert did not return a row');
    }

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      userId: row.user_id,
    };
  }

  async createRecipientRail(
    context: TransactionContext,
    input: CreateRecipientRailInput,
  ): Promise<RecipientRailRecord> {
    const queryable = getDatabaseQueryable(context);
    const result = await queryable.query<RecipientRailRow>(
      `
        INSERT INTO recipient_rails (
          id,
          recipient_id,
          rail,
          currency,
          country_code,
          details,
          readiness_status,
          provider_registration_strategy,
          provider_reference,
          provider_registration_error,
          provider_registered_at,
          is_default,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5,
          $6::jsonb,
          $7::recipient_rail_readiness_status,
          $8::recipient_provider_registration_strategy,
          $9,
          $10,
          $11::timestamptz,
          $12,
          $13,
          $14::timestamptz,
          $15::timestamptz
        )
        RETURNING
          id,
          recipient_id,
          rail,
          currency,
          country_code,
          details,
          readiness_status,
          provider_registration_strategy,
          provider_reference,
          provider_registration_error,
          provider_registered_at,
          is_default,
          is_active,
          created_at,
          updated_at
      `,
      [
        input.id,
        input.recipientId,
        input.rail,
        input.currency,
        input.countryCode,
        JSON.stringify(input.details),
        input.readinessStatus,
        input.providerRegistrationStrategy,
        input.providerReference,
        input.providerRegistrationError,
        input.providerRegisteredAt,
        input.isDefault,
        input.isActive,
        input.createdAt,
        input.updatedAt,
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error('Recipient rail insert did not return a row');
    }

    return mapRecipientRailRow(row);
  }

  async findRecipientOwnedByUser(
    context: TransactionContext,
    userId: string,
    recipientId: string,
  ): Promise<RecipientIdentity | null> {
    const queryable = getDatabaseQueryable(context);
    const result = await queryable.query<RecipientRow>(
      `
        SELECT id, user_id, name, status
        FROM recipients
        WHERE id = $1::uuid
          AND user_id = $2::uuid
        LIMIT 1
      `,
      [recipientId, userId],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      status: row.status,
      userId: row.user_id,
    };
  }
}

function mapRecipientRailRow(row: RecipientRailRow): RecipientRailRecord {
  return {
    countryCode: row.country_code,
    createdAt: row.created_at,
    currency: row.currency,
    details: row.details,
    id: row.id,
    isActive: row.is_active,
    isDefault: row.is_default,
    providerReference: row.provider_reference,
    providerRegisteredAt: row.provider_registered_at,
    providerRegistrationError: row.provider_registration_error,
    providerRegistrationStrategy: row.provider_registration_strategy,
    rail: row.rail,
    readinessStatus: row.readiness_status,
    recipientId: row.recipient_id,
    updatedAt: row.updated_at,
  };
}

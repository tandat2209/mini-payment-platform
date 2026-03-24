import { type TransactionContext } from '../../shared/application/transaction-manager';
import {
  type RecipientIdentity,
  type RecipientProviderRegistrationStrategy,
  type RecipientRailReadinessStatus,
  type RecipientRailRecord,
} from './recipient-onboarding.types';

export type CreateRecipientInput = {
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
  userId: string;
};

export type CreateRecipientRailInput = {
  countryCode: string;
  createdAt: string;
  currency: string;
  details: Record<string, string>;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  providerReference: string | null;
  providerRegisteredAt: string | null;
  providerRegistrationError: string | null;
  providerRegistrationStrategy: RecipientProviderRegistrationStrategy;
  rail: string;
  readinessStatus: RecipientRailReadinessStatus;
  recipientId: string;
  updatedAt: string;
};

export interface RecipientWriteRepository {
  createRecipient(
    context: TransactionContext,
    input: CreateRecipientInput,
  ): Promise<RecipientIdentity>;
  createRecipientRail(
    context: TransactionContext,
    input: CreateRecipientRailInput,
  ): Promise<RecipientRailRecord>;
  findRecipientOwnedByUser(
    context: TransactionContext,
    userId: string,
    recipientId: string,
  ): Promise<RecipientIdentity | null>;
  markProviderRegistrationFailed(
    context: TransactionContext,
    input: {
      providerRegistrationError: string;
      recipientRailId: string;
      updatedAt: string;
    },
  ): Promise<RecipientRailRecord>;
  markProviderRegistrationSucceeded(
    context: TransactionContext,
    input: {
      providerReference: string;
      providerRegisteredAt: string;
      recipientRailId: string;
      updatedAt: string;
    },
  ): Promise<RecipientRailRecord>;
}

export const RECIPIENT_WRITE_REPOSITORY = Symbol('RECIPIENT_WRITE_REPOSITORY');

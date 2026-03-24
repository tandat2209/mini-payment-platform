import type {
  RecipientProviderRegistrationStrategy,
  RecipientRail,
  RecipientRailReadinessStatus,
} from '../../recipients/domain/recipient-onboarding.types';

export type PayoutRecipientRailTarget = {
  currency: string | null;
  details: Record<string, string>;
  isActive: boolean;
  providerReference: string | null;
  providerRegistrationStrategy: RecipientProviderRegistrationStrategy;
  rail: RecipientRail;
  readinessStatus: RecipientRailReadinessStatus;
  recipientId: string;
  recipientName: string;
  recipientRailId: string;
  recipientStatus: string;
};

export interface PayoutRecipientRailRepository {
  findOwnedRecipientRail(
    customerId: string,
    recipientRailId: string,
  ): Promise<PayoutRecipientRailTarget | null>;
}

export const PAYOUT_RECIPIENT_RAIL_REPOSITORY = Symbol('PAYOUT_RECIPIENT_RAIL_REPOSITORY');

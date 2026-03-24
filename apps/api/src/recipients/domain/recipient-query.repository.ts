export type RecipientRailSummaryView = {
  countryCode: string;
  currency: string | null;
  id: string;
  isDefault: boolean;
  payoutReady: boolean;
  providerRegistrationError: string | null;
  providerRegistrationStrategy: string;
  rail: string;
  readinessStatus: string;
};

export type RecipientRailDetailView = RecipientRailSummaryView & {
  details: Record<string, string>;
};

export type RecipientListItemView = {
  createdAt: Date | string;
  id: string;
  name: string;
  rails: RecipientRailSummaryView[];
  status: string;
};

export type RecipientDetailView = {
  createdAt: Date | string;
  id: string;
  name: string;
  rails: RecipientRailDetailView[];
  status: string;
};

export interface RecipientQueryRepository {
  getRecipientDetail(customerId: string, recipientId: string): Promise<RecipientDetailView | null>;
  listRecipients(customerId: string): Promise<RecipientListItemView[]>;
}

export const RECIPIENT_QUERY_REPOSITORY = Symbol('RECIPIENT_QUERY_REPOSITORY');

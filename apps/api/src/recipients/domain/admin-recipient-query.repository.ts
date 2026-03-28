export type AdminRecipientListItemView = {
  createdAt: Date | string;
  customerExternalRef: string;
  customerId: string;
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
};

export interface AdminRecipientQueryRepository {
  listRecipients(): Promise<AdminRecipientListItemView[]>;
}

export const ADMIN_RECIPIENT_QUERY_REPOSITORY = Symbol('ADMIN_RECIPIENT_QUERY_REPOSITORY');

export type RegisterProviderManagedRecipientRailInput = {
  countryCode: string;
  currency: string;
  details: Record<string, string>;
  rail: string;
  recipientName: string;
};

export type ProviderManagedRecipientRegistrationResult =
  | {
      providerReference: string;
      providerRegisteredAt: string;
      status: 'active';
    }
  | {
      errorMessage: string;
      status: 'failed';
    };

export interface RecipientProviderRegistrationGateway {
  registerRecipientRail(
    input: RegisterProviderManagedRecipientRailInput,
  ): Promise<ProviderManagedRecipientRegistrationResult>;
}

export const RECIPIENT_PROVIDER_REGISTRATION_GATEWAY = Symbol(
  'RECIPIENT_PROVIDER_REGISTRATION_GATEWAY',
);

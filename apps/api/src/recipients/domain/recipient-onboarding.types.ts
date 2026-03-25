export type RecipientRail = 'ach' | 'sepa' | 'swift';

export type RecipientRailReadinessStatus =
  | 'draft'
  | 'pending_provider_registration'
  | 'active'
  | 'failed'
  | 'archived';

export type RecipientProviderRegistrationStrategy = 'platform_managed' | 'provider_managed';

export type RecipientRequirementFieldKind =
  | 'account_number'
  | 'iban'
  | 'routing_number'
  | 'swift_code';

export type RecipientCapabilityCurrencyOption = {
  currency: string;
};

export type RecipientCapabilityRailOption = {
  currencies: RecipientCapabilityCurrencyOption[];
  description: string;
  providerRegistrationStrategy: RecipientProviderRegistrationStrategy;
  rail: RecipientRail;
};

export type RecipientCapabilityCountryOption = {
  countryCode: string;
  countryName: string;
  rails: RecipientCapabilityRailOption[];
};

export type RecipientRequirementFieldDefinition = {
  helpText?: string;
  key: string;
  kind: RecipientRequirementFieldKind;
  label: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  required: boolean;
};

export type RecipientRailRequirementSet = {
  countryCode: string;
  currency: string;
  fields: RecipientRequirementFieldDefinition[];
  initialReadinessStatus: RecipientRailReadinessStatus;
  providerRegistrationStrategy: RecipientProviderRegistrationStrategy;
  rail: RecipientRail;
};

export type RecipientIdentity = {
  id: string;
  name: string;
  status: string;
  userId: string;
};

export type RecipientRailRecord = {
  countryCode: string;
  createdAt: Date | string;
  currency: string;
  details: Record<string, string>;
  id: string;
  isActive: boolean;
  isDefault: boolean;
  providerReference: string | null;
  providerRegisteredAt: Date | string | null;
  providerRegistrationError: string | null;
  providerRegistrationStrategy: RecipientProviderRegistrationStrategy;
  rail: string;
  readinessStatus: RecipientRailReadinessStatus;
  recipientId: string;
  updatedAt: Date | string;
};

export class UnsupportedRecipientRailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedRecipientRailConfigurationError';
  }
}

export class RecipientRailValidationError extends Error {
  constructor(readonly missingFields: string[]) {
    super(`Missing required recipient rail fields: ${missingFields.join(', ')}`);
    this.name = 'RecipientRailValidationError';
  }
}

export class RecipientNotFoundError extends Error {
  constructor(recipientId: string) {
    super(`Recipient not found: ${recipientId}`);
    this.name = 'RecipientNotFoundError';
  }
}

import { Injectable } from '@nestjs/common';

import {
  type RecipientRail,
  type RecipientRailRequirementSet,
  UnsupportedRecipientRailConfigurationError,
} from '../domain/recipient-onboarding.types';

type RequirementLookupInput = {
  countryCode: string;
  currency: string;
  rail: string;
};

const SEPA_COUNTRIES = new Set(['AT', 'BE', 'DE', 'ES', 'FR', 'IE', 'IT', 'NL', 'PT']);

@Injectable()
export class RecipientRailRequirementResolver {
  resolve(input: RequirementLookupInput): RecipientRailRequirementSet {
    const rail = normalizeRail(input.rail);
    const countryCode = normalizeCountryCode(input.countryCode);
    const currency = normalizeCurrency(input.currency);

    switch (rail) {
      case 'ach':
        return this.resolveAch(countryCode, currency);
      case 'sepa':
        return this.resolveSepa(countryCode, currency);
      case 'swift':
        return this.resolveSwift(countryCode, currency);
      default:
        throw new UnsupportedRecipientRailConfigurationError(
          `Unsupported recipient rail: ${input.rail}`,
        );
    }
  }

  private resolveAch(countryCode: string, currency: string): RecipientRailRequirementSet {
    if (countryCode !== 'US' || currency !== 'USD') {
      throw new UnsupportedRecipientRailConfigurationError(
        `ACH recipient onboarding is only supported for US recipients in USD`,
      );
    }

    return {
      countryCode,
      currency,
      fields: [
        {
          key: 'accountNumber',
          kind: 'account_number',
          label: 'Account number',
          required: true,
        },
        {
          key: 'routingNumber',
          kind: 'routing_number',
          label: 'Routing number',
          required: true,
        },
      ],
      initialReadinessStatus: 'active',
      providerRegistrationStrategy: 'platform_managed',
      rail: 'ach',
    };
  }

  private resolveSepa(countryCode: string, currency: string): RecipientRailRequirementSet {
    if (currency !== 'EUR' || !SEPA_COUNTRIES.has(countryCode)) {
      throw new UnsupportedRecipientRailConfigurationError(
        `SEPA recipient onboarding is only supported for supported SEPA countries in EUR`,
      );
    }

    return {
      countryCode,
      currency,
      fields: [
        {
          key: 'iban',
          kind: 'iban',
          label: 'IBAN',
          required: true,
        },
      ],
      initialReadinessStatus: 'pending_provider_registration',
      providerRegistrationStrategy: 'provider_managed',
      rail: 'sepa',
    };
  }

  private resolveSwift(countryCode: string, currency: string): RecipientRailRequirementSet {
    if (countryCode.length !== 2 || currency.length !== 3) {
      throw new UnsupportedRecipientRailConfigurationError(
        `SWIFT recipient onboarding requires a two-letter country and three-letter currency`,
      );
    }

    return {
      countryCode,
      currency,
      fields: [
        {
          key: 'accountNumber',
          kind: 'account_number',
          label: 'Account number',
          required: true,
        },
        {
          key: 'swiftCode',
          kind: 'swift_code',
          label: 'SWIFT / BIC',
          required: true,
        },
      ],
      initialReadinessStatus: 'pending_provider_registration',
      providerRegistrationStrategy: 'provider_managed',
      rail: 'swift',
    };
  }
}

function normalizeRail(value: string): RecipientRail {
  return value.trim().toLowerCase() as RecipientRail;
}

function normalizeCountryCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeCurrency(value: string): string {
  return value.trim().toUpperCase();
}

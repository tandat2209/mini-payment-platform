import { Injectable } from '@nestjs/common';

import {
  type RecipientCapabilityCountryOption,
  type RecipientRail,
  type RecipientRailRequirementSet,
  UnsupportedRecipientRailConfigurationError,
} from '../domain/recipient-onboarding.types';

type RequirementLookupInput = {
  countryCode: string;
  currency: string;
  rail: string;
};

type SupportedCountry = {
  countryCode: string;
  countryName: string;
};

const SEPA_COUNTRIES = new Set(['AT', 'BE', 'DE', 'ES', 'FR', 'IE', 'IT', 'NL', 'PT']);
const SUPPORTED_RECIPIENT_COUNTRIES: SupportedCountry[] = [
  {
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    countryCode: 'DE',
    countryName: 'Germany',
  },
  {
    countryCode: 'FR',
    countryName: 'France',
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
  },
  {
    countryCode: 'NL',
    countryName: 'Netherlands',
  },
];
const SUPPORTED_SWIFT_CURRENCIES = ['USD', 'EUR'];

@Injectable()
export class RecipientRailRequirementResolver {
  listCapabilities(): RecipientCapabilityCountryOption[] {
    return SUPPORTED_RECIPIENT_COUNTRIES.map((country) => {
      const rails = [
        ...this.getAchCapability(country.countryCode),
        ...this.getSepaCapability(country.countryCode),
        this.getSwiftCapability(),
      ];

      return {
        countryCode: country.countryCode,
        countryName: country.countryName,
        rails,
      };
    }).filter((country) => country.rails.length > 0);
  }

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
          helpText: 'Use the domestic account number for the US beneficiary.',
          key: 'accountNumber',
          kind: 'account_number',
          label: 'Account number',
          maxLength: 17,
          minLength: 4,
          pattern: '^[0-9]{4,17}$',
          placeholder: '123456789',
          required: true,
        },
        {
          helpText: 'Enter the 9-digit ABA routing number.',
          key: 'routingNumber',
          kind: 'routing_number',
          label: 'Routing number',
          maxLength: 9,
          minLength: 9,
          pattern: '^[0-9]{9}$',
          placeholder: '021000021',
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
          helpText: 'Provide the beneficiary IBAN without spaces if possible.',
          key: 'iban',
          kind: 'iban',
          label: 'IBAN',
          maxLength: 34,
          minLength: 15,
          pattern: '^[A-Z]{2}[A-Z0-9]{13,32}$',
          placeholder: 'DE89370400440532013000',
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
          helpText: 'Use the beneficiary account number for the receiving bank account.',
          key: 'accountNumber',
          kind: 'account_number',
          label: 'Account number',
          maxLength: 34,
          minLength: 4,
          pattern: '^[A-Za-z0-9]{4,34}$',
          placeholder: '1234567890',
          required: true,
        },
        {
          helpText: 'Provide the 8 or 11 character SWIFT / BIC code.',
          key: 'swiftCode',
          kind: 'swift_code',
          label: 'SWIFT / BIC',
          maxLength: 11,
          minLength: 8,
          pattern: '^[A-Z0-9]{8}([A-Z0-9]{3})?$',
          placeholder: 'DEUTDEFF',
          required: true,
        },
      ],
      initialReadinessStatus: 'pending_provider_registration',
      providerRegistrationStrategy: 'provider_managed',
      rail: 'swift',
    };
  }

  private getAchCapability(countryCode: string): RecipientCapabilityCountryOption['rails'] {
    if (countryCode !== 'US') {
      return [];
    }

    return [
      {
        currencies: [{ currency: 'USD' }],
        description: 'US domestic bank rails',
        providerRegistrationStrategy: 'platform_managed',
        rail: 'ach',
      },
    ];
  }

  private getSepaCapability(countryCode: string): RecipientCapabilityCountryOption['rails'] {
    if (!SEPA_COUNTRIES.has(countryCode)) {
      return [];
    }

    return [
      {
        currencies: [{ currency: 'EUR' }],
        description: 'Single euro payments area',
        providerRegistrationStrategy: 'provider_managed',
        rail: 'sepa',
      },
    ];
  }

  private getSwiftCapability(): RecipientCapabilityCountryOption['rails'][number] {
    return {
      currencies: SUPPORTED_SWIFT_CURRENCIES.map((currency) => ({
        currency,
      })),
      description: 'Cross-border bank transfer',
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

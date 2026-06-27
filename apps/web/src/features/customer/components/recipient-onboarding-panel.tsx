import { LoaderCircle, WandSparkles } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  RecipientCapabilitiesResponse,
  RecipientRequirementField,
  RecipientRequirementsResponse,
  RecipientSummary,
} from '@/features/customer/api';
import { toTitleCase } from '@/features/customer/lib/utils';

import { EmptyState, LoadingBlock } from './shared';

export function RecipientOnboardingPanel({
  activeRecipient,
  capabilitiesQuery,
  currentError,
  detailValues,
  isMutating,
  mode,
  countryCode,
  currency,
  onCountryCodeChange,
  onCurrencyChange,
  onDetailValueChange,
  onRailChange,
  onRecipientNameChange,
  onSubmit,
  rail,
  recipientName,
  requirementsQuery,
  successMessage,
}: {
  activeRecipient: RecipientSummary | null;
  capabilitiesQuery: {
    data: RecipientCapabilitiesResponse | undefined;
    error: Error | null;
    isError: boolean;
    isLoading: boolean;
  };
  countryCode: string;
  currentError: string | null;
  currency: string;
  detailValues: Record<string, string>;
  isMutating: boolean;
  mode: 'create' | 'add-rail';
  onCountryCodeChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  onDetailValueChange: (key: string, value: string) => void;
  onRailChange: (value: 'ach' | 'sepa' | 'swift') => void;
  onRecipientNameChange: (value: string) => void;
  onSubmit: () => void;
  rail: 'ach' | 'sepa' | 'swift';
  recipientName: string;
  requirementsQuery: {
    data: RecipientRequirementsResponse | undefined;
    error: Error | null;
    isError: boolean;
    isLoading: boolean;
  };
  successMessage: string | null;
}): JSX.Element {
  const requirementFields = requirementsQuery.data?.fields ?? [];
  const countryOptions = capabilitiesQuery.data?.items ?? [];
  const selectedCountry =
    countryOptions.find((option) => option.countryCode === countryCode) ??
    countryOptions[0] ??
    null;
  const railOptions = selectedCountry?.rails ?? [];
  const selectedRail = railOptions.find((option) => option.rail === rail) ?? railOptions[0] ?? null;
  const currencyOptions = selectedRail?.currencies ?? [];
  const selectedRailDescription = selectedRail?.description ?? null;

  return (
    <Card className="rounded-[30px] border border-[#dfe5ff] bg-[#f7f9ff] shadow-[0_18px_50px_rgba(37,87,255,0.07)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
              {mode === 'create' ? 'Create recipient' : 'Add rail'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {mode === 'create'
                ? 'Onboard payout destination'
                : `Attach another rail to ${activeRecipient?.name ?? 'recipient'}`}
            </h2>
          </div>
          {requirementsQuery.data ? (
            <Badge
              tone={
                requirementsQuery.data.providerRegistrationStrategy === 'provider_managed'
                  ? 'warning'
                  : 'positive'
              }
            >
              {requirementsQuery.data.providerRegistrationStrategy === 'provider_managed'
                ? 'Needs provider registration'
                : 'Ready after save'}
            </Badge>
          ) : null}
        </div>

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {currentError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {currentError}
          </div>
        ) : null}

        <div className="grid gap-4">
          {mode === 'create' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="recipient-name">
                Recipient name
              </label>
              <Input
                id="recipient-name"
                onChange={(event) => {
                  onRecipientNameChange(event.target.value);
                }}
                placeholder="Vendor or beneficiary name"
                value={recipientName}
              />
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Select onValueChange={onRailChange} value={rail}>
              <SelectTrigger>
                <SelectValue placeholder="Rail" />
              </SelectTrigger>
              <SelectContent>
                {railOptions.map((option) => (
                  <SelectItem key={option.rail} value={option.rail}>
                    {toTitleCase(option.rail)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={onCountryCodeChange} value={countryCode}>
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {countryOptions.map((option) => (
                  <SelectItem key={option.countryCode} value={option.countryCode}>
                    <span className="inline-flex items-center gap-2">
                      <CountryFlag countryCode={option.countryCode} />
                      <span>{option.countryName}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={onCurrencyChange} value={currency}>
              <SelectTrigger>
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.currency} value={option.currency}>
                    {option.currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!capabilitiesQuery.isLoading &&
          !capabilitiesQuery.isError &&
          countryOptions.length === 0 ? (
            <EmptyState
              message="No recipient onboarding combinations are currently enabled."
              title="Onboarding unavailable"
            />
          ) : null}

          {selectedRailDescription ? (
            <p className="text-sm text-[#9aa6ca]">{selectedRailDescription}</p>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-[#dfe5ff] bg-white p-4">
          <div className="flex items-center gap-2">
            <WandSparkles className="h-4 w-4 text-[#a6b0d2]" />
            <p className="text-sm font-semibold text-slate-900">Required rail details</p>
          </div>

          {requirementsQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              <LoadingBlock className="h-11" />
              <LoadingBlock className="h-11" />
            </div>
          ) : null}

          {capabilitiesQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              <LoadingBlock className="h-11" />
              <LoadingBlock className="h-11" />
            </div>
          ) : null}

          {capabilitiesQuery.isError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {capabilitiesQuery.error?.message ?? 'Recipient capabilities unavailable'}
            </div>
          ) : null}

          {requirementsQuery.isError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {requirementsQuery.error?.message ?? 'Requirements unavailable'}
            </div>
          ) : null}

          {!requirementsQuery.isLoading &&
          !requirementsQuery.isError &&
          requirementsQuery.data &&
          requirementFields.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                message="No fields were returned for this rail configuration."
                title="No rail fields available"
              />
            </div>
          ) : null}

          {!requirementsQuery.isLoading &&
          !requirementsQuery.isError &&
          requirementFields.length > 0 ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="default">
                  {formatReadinessStatus(requirementsQuery.data?.initialReadinessStatus)}
                </Badge>
                <Badge
                  tone={
                    requirementsQuery.data?.providerRegistrationStrategy === 'provider_managed'
                      ? 'warning'
                      : 'positive'
                  }
                >
                  {requirementsQuery.data?.providerRegistrationStrategy === 'provider_managed'
                    ? 'Provider managed'
                    : 'Platform managed'}
                </Badge>
              </div>

              <div className="grid gap-4">
                {requirementFields.map((field) => (
                  <RecipientFieldInput
                    field={field}
                    key={field.key}
                    onChange={onDetailValueChange}
                    value={detailValues[field.key] ?? ''}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[#9aa6ca]">
            {mode === 'create'
              ? 'Save the recipient now, then reuse the saved rail in payout flows.'
              : 'This adds another payout method without duplicating the recipient identity.'}
          </p>
          <Button
            disabled={
              isMutating ||
              capabilitiesQuery.isLoading ||
              capabilitiesQuery.isError ||
              requirementsQuery.isLoading ||
              !requirementsQuery.data ||
              (mode === 'create' && recipientName.trim().length === 0)
            }
            onClick={onSubmit}
          >
            {isMutating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {mode === 'create' ? 'Create recipient' : 'Add rail'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatReadinessStatus(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return toTitleCase(value.replace(/_/g, ' '));
}

function RecipientFieldInput({
  field,
  onChange,
  value,
}: {
  field: RecipientRequirementField;
  onChange: (key: string, value: string) => void;
  value: string;
}): JSX.Element {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700" htmlFor={`field-${field.key}`}>
          {field.label}
        </label>
        {field.required ? <Badge tone="warning">Required</Badge> : null}
      </div>
      <Input
        autoCapitalize={
          field.kind === 'swift_code' || field.kind === 'iban' ? 'characters' : 'none'
        }
        id={`field-${field.key}`}
        maxLength={field.maxLength}
        minLength={field.minLength}
        onChange={(event) => {
          onChange(field.key, event.target.value);
        }}
        pattern={field.pattern}
        placeholder={field.placeholder ?? field.label}
        value={value}
      />
      {field.helpText ? <p className="text-xs text-[#9aa6ca]">{field.helpText}</p> : null}
    </div>
  );
}

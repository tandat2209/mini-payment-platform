import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { addRecipientRail, createRecipient } from '../../api';
import {
  useRecipientCapabilitiesQuery,
  useRecipientRequirementsQuery,
  useRecipientsQuery,
} from '../../hooks/use-dashboard-queries';
import { CustomerRecipientsPage } from './customer-recipients-page';

export function CustomerRecipientsRoutePage(): JSX.Element {
  const queryClient = useQueryClient();
  const recipientsQuery = useRecipientsQuery();
  const capabilitiesQuery = useRecipientCapabilitiesQuery();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [rail, setRail] = useState<'ach' | 'sepa' | 'swift' | null>(null);
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mode: 'create' | 'add-rail' = selectedRecipientId ? 'add-rail' : 'create';
  const capabilityCountries = capabilitiesQuery.data?.items ?? [];
  const selectedCountry =
    capabilityCountries.find((country) => country.countryCode === countryCode) ??
    capabilityCountries[0] ??
    null;
  const selectedCountryCode = selectedCountry?.countryCode ?? '';
  const availableRails = selectedCountry?.rails ?? [];
  const selectedRail =
    availableRails.find((railOption) => railOption.rail === rail) ?? availableRails[0] ?? null;
  const selectedRailValue = selectedRail?.rail ?? '';
  const availableCurrencies = selectedRail?.currencies ?? [];
  const selectedCurrency =
    availableCurrencies.find((currencyOption) => currencyOption.currency === currency) ??
    availableCurrencies[0] ??
    null;
  const selectedCurrencyValue = selectedCurrency?.currency ?? '';

  const requirementsQuery = useRecipientRequirementsQuery({
    countryCode: selectedCountryCode,
    currency: selectedCurrencyValue,
    enabled:
      selectedCountryCode.length === 2 &&
      selectedCurrencyValue.length === 3 &&
      selectedRailValue.length > 0,
    rail: (selectedRailValue || 'ach') as 'ach' | 'sepa' | 'swift',
  });

  const createRecipientMutation = useMutation({
    mutationFn: createRecipient,
    onSuccess: async (recipient) => {
      const createdRail = recipient.rails[0];
      setSuccessMessage(
        createdRail?.providerRegistrationError
          ? `${recipient.name} was saved, but the provider rejected this rail: ${createdRail.providerRegistrationError}`
          : `${recipient.name} was saved. ${
              createdRail?.payoutReady
                ? 'This rail is ready for payout.'
                : 'This rail is waiting on provider registration.'
            }`,
      );
      setRecipientName('');
      setDetailValues({});
      setSelectedRecipientId(recipient.id);
      await queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
  });

  const addRecipientRailMutation = useMutation({
    mutationFn: async (input: { recipientId: string }) =>
      await addRecipientRail(input.recipientId, {
        countryCode: selectedCountryCode,
        currency: selectedCurrencyValue,
        details: pickRequirementDetails(detailValues, requirementsQuery.data?.fields ?? []),
        rail: selectedRailValue as 'ach' | 'sepa' | 'swift',
      }),
    onSuccess: async (result) => {
      setSuccessMessage(
        result.rail.providerRegistrationError
          ? `${toTitleCase(result.rail.rail)} rail was added, but the provider rejected it: ${result.rail.providerRegistrationError}`
          : `${toTitleCase(result.rail.rail)} rail added. ${
              result.rail.payoutReady
                ? 'It is immediately available for payout.'
                : 'It is waiting on provider registration.'
            }`,
      );
      setDetailValues({});
      await queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
  });

  const activeRecipient = useMemo(
    () =>
      recipientsQuery.data?.items.find((recipient) => recipient.id === selectedRecipientId) ?? null,
    [recipientsQuery.data?.items, selectedRecipientId],
  );

  function resetMutationMessages(): void {
    createRecipientMutation.reset();
    addRecipientRailMutation.reset();
    setSuccessMessage(null);
  }

  function handleCreateNew(): void {
    setSelectedRecipientId(null);
    setRecipientName('');
    setRail(null);
    setCountryCode(null);
    setCurrency(null);
    setDetailValues({});
    resetMutationMessages();
  }

  function handleSelectRecipient(recipientId: string): void {
    setSelectedRecipientId((current) => (current === recipientId ? null : recipientId));
    setDetailValues({});
    resetMutationMessages();
  }

  async function handleSubmit(): Promise<void> {
    resetMutationMessages();

    if (!requirementsQuery.data) {
      return;
    }

    if (!selectedCountryCode || !selectedCurrencyValue || !selectedRailValue) {
      return;
    }

    const details = pickRequirementDetails(detailValues, requirementsQuery.data.fields);

    if (mode === 'create') {
      await createRecipientMutation.mutateAsync({
        name: recipientName,
        rail: {
          countryCode: selectedCountryCode,
          currency: selectedCurrencyValue,
          details,
          rail: selectedRailValue as 'ach' | 'sepa' | 'swift',
        },
      });

      return;
    }

    if (!selectedRecipientId) {
      return;
    }

    await addRecipientRailMutation.mutateAsync({
      recipientId: selectedRecipientId,
    });
  }

  return (
    <CustomerRecipientsPage
      activeRecipient={activeRecipient}
      capabilitiesQuery={{
        data: capabilitiesQuery.data,
        error: capabilitiesQuery.error,
        isError: capabilitiesQuery.isError,
        isLoading: capabilitiesQuery.isLoading,
      }}
      countryCode={selectedCountryCode}
      currentError={
        capabilitiesQuery.error?.message ??
        createRecipientMutation.error?.message ??
        addRecipientRailMutation.error?.message ??
        recipientsQuery.error?.message ??
        null
      }
      currency={selectedCurrencyValue}
      detailValues={detailValues}
      isMutating={createRecipientMutation.isPending || addRecipientRailMutation.isPending}
      isRecipientsLoading={recipientsQuery.isLoading}
      mode={mode}
      onCountryCodeChange={(value) => {
        setCountryCode(value);
        setRail(null);
        setCurrency(null);
        setDetailValues({});
        resetMutationMessages();
      }}
      onCreateNew={handleCreateNew}
      onCurrencyChange={(value) => {
        setCurrency(value);
        setDetailValues({});
        resetMutationMessages();
      }}
      onDetailValueChange={(key, value) => {
        setDetailValues((current) => ({
          ...current,
          [key]: value,
        }));
      }}
      onRailChange={(value) => {
        setRail(value);
        setCurrency(null);
        setDetailValues({});
        resetMutationMessages();
      }}
      onRecipientNameChange={(value) => {
        setRecipientName(value);
        resetMutationMessages();
      }}
      onSelectRecipient={handleSelectRecipient}
      onSubmit={() => {
        void handleSubmit();
      }}
      rail={(selectedRailValue || 'ach') as 'ach' | 'sepa' | 'swift'}
      recipientName={recipientName}
      recipients={recipientsQuery.data?.items ?? []}
      requirementsQuery={{
        data: requirementsQuery.data,
        error: requirementsQuery.error,
        isError: requirementsQuery.isError,
        isLoading: requirementsQuery.isLoading,
      }}
      selectedRecipientId={selectedRecipientId}
      successMessage={successMessage}
    />
  );
}

function pickRequirementDetails(
  values: Record<string, string>,
  fields: Array<{ key: string }>,
): Record<string, string> {
  return fields.reduce<Record<string, string>>((selected, field) => {
    const value = values[field.key]?.trim();

    if (value) {
      selected[field.key] = value;
    }

    return selected;
  }, {});
}

function toTitleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

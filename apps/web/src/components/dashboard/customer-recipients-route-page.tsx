import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { addRecipientRail, createRecipient } from '../../api';
import {
  useRecipientRequirementsQuery,
  useRecipientsQuery,
} from '../../hooks/use-dashboard-queries';
import { CustomerRecipientsPage } from './customer-recipients-page';

const defaultRail: 'ach' | 'sepa' | 'swift' = 'ach';
const defaultCountryCode = 'US';
const defaultCurrency = 'USD';

export function CustomerRecipientsRoutePage(): JSX.Element {
  const queryClient = useQueryClient();
  const recipientsQuery = useRecipientsQuery();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [rail, setRail] = useState<'ach' | 'sepa' | 'swift'>(defaultRail);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [detailValues, setDetailValues] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const mode: 'create' | 'add-rail' = selectedRecipientId ? 'add-rail' : 'create';

  const requirementsQuery = useRecipientRequirementsQuery({
    countryCode,
    currency,
    enabled: countryCode.length === 2 && currency.length === 3,
    rail,
  });

  const createRecipientMutation = useMutation({
    mutationFn: createRecipient,
    onSuccess: async (recipient) => {
      setSuccessMessage(
        `${recipient.name} was saved. ${
          recipient.rails[0]?.payoutReady
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
        countryCode,
        currency,
        details: pickRequirementDetails(detailValues, requirementsQuery.data?.fields ?? []),
        rail,
      }),
    onSuccess: async (result) => {
      setSuccessMessage(
        `${toTitleCase(result.rail.rail)} rail added. ${
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
    setRail(defaultRail);
    setCountryCode(defaultCountryCode);
    setCurrency(defaultCurrency);
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

    const details = pickRequirementDetails(detailValues, requirementsQuery.data.fields);

    if (mode === 'create') {
      await createRecipientMutation.mutateAsync({
        name: recipientName,
        rail: {
          countryCode,
          currency,
          details,
          rail,
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
      countryCode={countryCode}
      currentError={
        createRecipientMutation.error?.message ??
        addRecipientRailMutation.error?.message ??
        recipientsQuery.error?.message ??
        null
      }
      currency={currency}
      detailValues={detailValues}
      isMutating={createRecipientMutation.isPending || addRecipientRailMutation.isPending}
      isRecipientsLoading={recipientsQuery.isLoading}
      mode={mode}
      onCountryCodeChange={(value) => {
        setCountryCode(value);
        resetMutationMessages();
      }}
      onCreateNew={handleCreateNew}
      onCurrencyChange={(value) => {
        setCurrency(value);
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
      rail={rail}
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

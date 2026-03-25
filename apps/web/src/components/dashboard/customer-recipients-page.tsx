import type { JSX } from 'react';

import type {
  RecipientCapabilitiesResponse,
  RecipientRequirementsResponse,
  RecipientSummary,
} from '../../api';
import { RecipientDirectory } from './recipient-directory';
import { RecipientOnboardingPanel } from './recipient-onboarding-panel';

export function CustomerRecipientsPage({
  activeRecipient,
  capabilitiesQuery,
  countryCode,
  currentError,
  currency,
  detailValues,
  isMutating,
  isRecipientsLoading,
  mode,
  onCountryCodeChange,
  onCreateNew,
  onCurrencyChange,
  onDetailValueChange,
  onRailChange,
  onRecipientNameChange,
  onSelectRecipient,
  onSubmit,
  rail,
  recipientName,
  recipients,
  requirementsQuery,
  selectedRecipientId,
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
  isRecipientsLoading: boolean;
  mode: 'create' | 'add-rail';
  onCountryCodeChange: (value: string) => void;
  onCreateNew: () => void;
  onCurrencyChange: (value: string) => void;
  onDetailValueChange: (key: string, value: string) => void;
  onRailChange: (value: 'ach' | 'sepa' | 'swift') => void;
  onRecipientNameChange: (value: string) => void;
  onSelectRecipient: (recipientId: string) => void;
  onSubmit: () => void;
  rail: 'ach' | 'sepa' | 'swift';
  recipientName: string;
  recipients: RecipientSummary[];
  requirementsQuery: {
    data: RecipientRequirementsResponse | undefined;
    error: Error | null;
    isError: boolean;
    isLoading: boolean;
  };
  selectedRecipientId: string | null;
  successMessage: string | null;
}): JSX.Element {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <RecipientDirectory
        isLoading={isRecipientsLoading}
        onCreateNew={onCreateNew}
        onSelectRecipient={onSelectRecipient}
        recipients={recipients}
        selectedRecipientId={selectedRecipientId}
      />
      <RecipientOnboardingPanel
        activeRecipient={activeRecipient}
        capabilitiesQuery={capabilitiesQuery}
        countryCode={countryCode}
        currentError={currentError}
        currency={currency}
        detailValues={detailValues}
        isMutating={isMutating}
        mode={mode}
        onCountryCodeChange={onCountryCodeChange}
        onCurrencyChange={onCurrencyChange}
        onDetailValueChange={onDetailValueChange}
        onRailChange={onRailChange}
        onRecipientNameChange={onRecipientNameChange}
        onSubmit={onSubmit}
        rail={rail}
        recipientName={recipientName}
        requirementsQuery={requirementsQuery}
        successMessage={successMessage}
      />
    </section>
  );
}

import { FlaskConical, Radar, ReceiptText } from 'lucide-react';
import type { JSX } from 'react';

import { FundingSimulatorCard } from '@/features/sandbox/components/funding-simulator-card';
import { SandboxPageShell } from '@/features/sandbox/components/sandbox-page-shell';
import { useSandboxStore } from '@/features/sandbox/store/sandbox-store';

export function SandboxFundingRoutePage(): JSX.Element {
  const formState = useSandboxStore((state) => state.fundingFormState);
  const isSubmitting = useSandboxStore((state) => state.isFundingSubmitting);
  const simulationError = useSandboxStore((state) => state.fundingSimulationError);
  const setFormField = useSandboxStore((state) => state.setFundingFormField);
  const simulateFunding = useSandboxStore((state) => state.simulateFunding);
  const simulationResult = useSandboxStore((state) => state.fundingSimulationResult);

  return (
    <SandboxPageShell
      badge="Local sandbox only"
      description="Use this page to dispatch provider-style inbound funding webhooks directly to the PSP sandbox service."
      eyebrow="PSP sandbox"
      metrics={[
        { icon: FlaskConical, label: 'Current flow', value: 'Funding webhook' },
        { icon: Radar, label: 'Delivery path', value: 'Web -> PSP sandbox -> API' },
        { icon: ReceiptText, label: 'Audit result', value: 'Webhook + balance + ledger' },
      ]}
      title="Funding webhooks"
    >
      <FundingSimulatorCard
        error={simulationError}
        formState={formState}
        isSubmitting={isSubmitting}
        onChange={setFormField}
        onSubmit={simulateFunding}
        result={simulationResult}
      />
    </SandboxPageShell>
  );
}

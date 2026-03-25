import { FlaskConical, Radar, ReceiptText } from 'lucide-react';
import type { JSX } from 'react';

import { useSandboxStore } from '@/store/sandbox-store';

import { FundingSimulatorCard } from './funding-simulator-card';
import { SandboxPageShell } from './sandbox-page-shell';

export function SandboxFundingRoutePage(): JSX.Element {
  const formState = useSandboxStore((state) => state.formState);
  const isSubmitting = useSandboxStore((state) => state.isSubmitting);
  const simulationError = useSandboxStore((state) => state.simulationError);
  const setFormField = useSandboxStore((state) => state.setFormField);
  const simulateFunding = useSandboxStore((state) => state.simulateFunding);
  const simulationResult = useSandboxStore((state) => state.simulationResult);

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

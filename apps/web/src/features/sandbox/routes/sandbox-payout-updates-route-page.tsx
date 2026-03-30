import { ArrowLeftRight, CheckCheck, Radar } from 'lucide-react';
import type { JSX } from 'react';

import { PayoutUpdateSimulatorCard } from '@/features/sandbox/components/payout-update-simulator-card';
import { SandboxPageShell } from '@/features/sandbox/components/sandbox-page-shell';
import { useSandboxStore } from '@/features/sandbox/store/sandbox-store';

export function SandboxPayoutUpdatesRoutePage(): JSX.Element {
  const formState = useSandboxStore((state) => state.payoutUpdateFormState);
  const isSubmitting = useSandboxStore((state) => state.isPayoutUpdateSubmitting);
  const simulationError = useSandboxStore((state) => state.payoutUpdateSimulationError);
  const setFormField = useSandboxStore((state) => state.setPayoutUpdateFormField);
  const simulatePayoutUpdate = useSandboxStore((state) => state.simulatePayoutUpdate);
  const simulationResult = useSandboxStore((state) => state.payoutUpdateSimulationResult);

  return (
    <SandboxPageShell
      badge="Local sandbox only"
      description="Use this page to dispatch provider-style payout status callbacks directly into the payout webhook endpoint."
      eyebrow="PSP sandbox"
      metrics={[
        { icon: CheckCheck, label: 'Callback states', value: 'Processing, paid, failed, returned' },
        { icon: Radar, label: 'Delivery path', value: 'Web -> PSP sandbox -> API' },
        { icon: ArrowLeftRight, label: 'Target', value: 'Payout lifecycle simulation' },
      ]}
      title="Payout updates"
    >
      <PayoutUpdateSimulatorCard
        error={simulationError}
        formState={formState}
        isSubmitting={isSubmitting}
        onChange={setFormField}
        onSubmit={simulatePayoutUpdate}
        result={simulationResult}
      />
    </SandboxPageShell>
  );
}

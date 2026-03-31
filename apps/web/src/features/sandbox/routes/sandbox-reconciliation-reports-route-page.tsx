import type { JSX } from 'react';

import { ReconciliationReportSimulatorCard } from '@/features/sandbox/components/reconciliation-report-simulator-card';
import { SandboxPageShell } from '@/features/sandbox/components/sandbox-page-shell';
import { useSandboxStore } from '@/features/sandbox/store/sandbox-store';

export function SandboxReconciliationReportsRoutePage(): JSX.Element {
  const {
    isReconciliationReportSubmitting,
    reconciliationReportFormState,
    reconciliationReportSimulationError,
    reconciliationReportSimulationResult,
    setReconciliationReportFormField,
    simulateReconciliationReport,
  } = useSandboxStore();

  return (
    <SandboxPageShell
      description="Generate provider-style end-of-day reconciliation batches and send them straight into the API reconciliation webhook."
      eyebrow="PSP sandbox"
      title="Reconciliation reports"
    >
      <ReconciliationReportSimulatorCard
        error={reconciliationReportSimulationError}
        formState={reconciliationReportFormState}
        isSubmitting={isReconciliationReportSubmitting}
        onChange={setReconciliationReportFormField}
        onSubmit={simulateReconciliationReport}
        result={reconciliationReportSimulationResult}
      />
    </SandboxPageShell>
  );
}

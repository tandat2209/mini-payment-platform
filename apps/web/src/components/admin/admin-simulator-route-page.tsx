import type { JSX } from 'react';

import { useAdminStore } from '../../store/admin-store';
import { AdminSimulatorCard } from './admin-simulator-card';

export function AdminSimulatorRoutePage(): JSX.Element {
  const formState = useAdminStore((state) => state.formState);
  const isSubmitting = useAdminStore((state) => state.isSubmitting);
  const simulationError = useAdminStore((state) => state.simulationError);
  const setFormField = useAdminStore((state) => state.setFormField);
  const simulateFunding = useAdminStore((state) => state.simulateFunding);
  const simulationResult = useAdminStore((state) => state.simulationResult);

  return (
    <AdminSimulatorCard
      formState={formState}
      isSubmitting={isSubmitting}
      error={simulationError}
      onChange={setFormField}
      onSubmit={simulateFunding}
      result={simulationResult}
    />
  );
}

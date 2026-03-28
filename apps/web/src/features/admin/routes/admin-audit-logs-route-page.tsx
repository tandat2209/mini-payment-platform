import type { JSX } from 'react';

import { AdminPlaceholderPage } from '@/features/admin/components/admin-placeholder-page';

export function AdminAuditLogsRoutePage(): JSX.Element {
  return (
    <AdminPlaceholderPage
      description="Operator actions, manual interventions, and policy-sensitive admin changes will be surfaced here."
      eyebrow="Audit"
      title="Audit logs"
    />
  );
}

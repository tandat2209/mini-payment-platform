import type { JSX } from 'react';

import { AdminPlaceholderPage } from '@/features/admin/components/admin-placeholder-page';

export function AdminSettingsRoutePage(): JSX.Element {
  return (
    <AdminPlaceholderPage
      description="Environment controls, admin preferences, and future operator settings will live here."
      eyebrow="Settings"
      title="Admin settings"
    />
  );
}

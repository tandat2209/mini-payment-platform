import type { JSX } from 'react';

import { AdminPlaceholderPage } from '@/features/admin/components/admin-placeholder-page';

export function AdminReportsRoutePage(): JSX.Element {
  return (
    <AdminPlaceholderPage
      description="Scheduled exports, finance summaries, and downloadable reporting packs will live here."
      eyebrow="Reports"
      title="Reporting workspace"
    />
  );
}

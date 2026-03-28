import { useNavigate } from '@tanstack/react-router';
import type { JSX } from 'react';

import { AdminDashboardPage } from '@/features/admin/components/admin-dashboard-page';

export function AdminDashboardRoutePage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <AdminDashboardPage
      onNavigate={(path) => {
        void navigate({ to: path });
      }}
    />
  );
}

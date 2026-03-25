import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import type { JSX } from 'react';

import { AppShell } from '@/app/shell/app-shell';
import {
  getActiveNavigationId,
  getWorkspaceFromPath,
  getWorkspaceNavigationItems,
  workspaceItems,
} from '@/app/shell/navigation-config';

function App(): JSX.Element {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const activeWorkspace = getWorkspaceFromPath(pathname);
  const activeNavigationId = getActiveNavigationId(pathname);

  function handleWorkspaceSelect(workspace: 'customer' | 'admin' | 'sandbox'): void {
    const target = workspaceItems.find((item) => item.id === workspace);

    if (!target) {
      return;
    }

    void navigate({ to: target.defaultPath });
  }

  function handleNavigationSelect(path: string): void {
    void navigate({ to: path });
  }

  return (
    <AppShell
      activeNavigationId={activeNavigationId}
      activeWorkspace={activeWorkspace}
      navigationItems={getWorkspaceNavigationItems(activeWorkspace)}
      onNavigationSelect={handleNavigationSelect}
      onWorkspaceSelect={handleWorkspaceSelect}
    >
      <Outlet />
    </AppShell>
  );
}

export default App;

import type { JSX, ReactNode } from 'react';

import { MobileNavigation } from './mobile-navigation';
import type { NavigationId, NavigationItem, Workspace } from './navigation-config';
import { SidebarNavigation } from './sidebar-navigation';

export function AppShell({
  activeNavigationId,
  activeWorkspace,
  children,
  navigationItems,
  onNavigationSelect,
  onWorkspaceSelect,
}: {
  activeNavigationId: NavigationId;
  activeWorkspace: Workspace;
  children: ReactNode;
  navigationItems: NavigationItem[];
  onNavigationSelect: (path: string) => void;
  onWorkspaceSelect: (workspace: Workspace) => void;
}): JSX.Element {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-5 px-4 py-4 lg:px-6">
        <SidebarNavigation
          activeNavigationId={activeNavigationId}
          activeWorkspace={activeWorkspace}
          navigationItems={navigationItems}
          onNavigationSelect={onNavigationSelect}
          onWorkspaceSelect={onWorkspaceSelect}
        />

        <div className="min-w-0 flex-1">
          <MobileNavigation
            activeNavigationId={activeNavigationId}
            activeWorkspace={activeWorkspace}
            navigationItems={navigationItems}
            onNavigationSelect={onNavigationSelect}
            onWorkspaceSelect={onWorkspaceSelect}
          />

          <div className="space-y-5 py-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

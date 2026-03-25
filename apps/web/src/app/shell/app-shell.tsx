import type { CSSProperties, JSX, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { CUSTOMER_MOBILE_NAV_OFFSET, CUSTOMER_MOBILE_PAYOUT_ACTION_OFFSET } from './mobile-layout';
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
  const mobileLayoutStyle = {
    '--customer-mobile-nav-offset': CUSTOMER_MOBILE_NAV_OFFSET,
    '--customer-mobile-payout-action-offset': CUSTOMER_MOBILE_PAYOUT_ACTION_OFFSET,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-transparent" style={mobileLayoutStyle}>
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-5 px-4 py-4 lg:px-6">
        <SidebarNavigation
          activeNavigationId={activeNavigationId}
          activeWorkspace={activeWorkspace}
          navigationItems={navigationItems}
          onNavigationSelect={onNavigationSelect}
          onWorkspaceSelect={onWorkspaceSelect}
        />

        <div className="min-w-0 flex-1">
          {activeWorkspace === 'customer' ? (
            <>
              <MobileNavigation
                activeNavigationId={activeNavigationId}
                activeWorkspace={activeWorkspace}
                navigationItems={navigationItems}
                onNavigationSelect={onNavigationSelect}
              />

              <div className="space-y-5 py-2 pb-[var(--customer-mobile-nav-offset)] lg:pb-2">
                {children}
              </div>
            </>
          ) : (
            <>
              <div className="lg:hidden">
                <DesktopOnlyWorkspaceGate
                  onReturnToCustomer={() => {
                    onWorkspaceSelect('customer');
                  }}
                  workspace={activeWorkspace}
                />
              </div>
              <div className="hidden space-y-5 py-2 lg:block">{children}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DesktopOnlyWorkspaceGate({
  onReturnToCustomer,
  workspace,
}: {
  onReturnToCustomer: () => void;
  workspace: Exclude<Workspace, 'customer'>;
}): JSX.Element {
  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Desktop only
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {workspace === 'admin' ? 'Admin workspace' : 'PSP sandbox'}
          </h1>
          <p className="text-sm text-slate-500">
            This workspace is designed for dense operational tooling and is only available on
            desktop screens.
          </p>
        </div>

        <Button className="rounded-xl px-4" onClick={onReturnToCustomer}>
          Open customer app
        </Button>
      </CardContent>
    </Card>
  );
}

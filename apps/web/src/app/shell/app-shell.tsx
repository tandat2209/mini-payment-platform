import type { CSSProperties, JSX, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AdminTopbar } from '@/features/admin/components/admin-topbar';

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
      <div className="mx-auto flex min-h-screen max-w-[1520px] gap-7 px-4 py-4 sm:px-5 lg:px-8 lg:py-7">
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

              <div className="space-y-5 py-2 pb-[var(--customer-mobile-nav-offset)] lg:py-0 lg:pb-0">
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
              <div className="hidden space-y-5 py-2 lg:block">
                {activeWorkspace === 'admin' ? <AdminTopbar /> : null}
                {children}
              </div>
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

import type { JSX } from 'react';

import { cn } from '@/lib/utils';

import {
  getWorkspaceHeadline,
  type NavigationId,
  type NavigationItem,
  type Workspace,
} from './navigation-config';
import { WorkspaceSwitcher } from './workspace-switcher';

export function SidebarNavigation({
  activeNavigationId,
  activeWorkspace,
  navigationItems,
  onNavigationSelect,
  onWorkspaceSelect,
}: {
  activeNavigationId: NavigationId;
  activeWorkspace: Workspace;
  navigationItems: NavigationItem[];
  onNavigationSelect: (path: string) => void;
  onWorkspaceSelect: (workspace: Workspace) => void;
}): JSX.Element {
  const workspaceHeadline = getWorkspaceHeadline(activeWorkspace);
  const isOpsWorkspace = activeWorkspace === 'admin' || activeWorkspace === 'sandbox';

  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div
        className={cn(
          'sticky top-7 flex h-[calc(100vh-3.5rem)] flex-col rounded-[34px] border p-6 text-foreground shadow-primary-soft backdrop-blur-xl',
          isOpsWorkspace ? 'border-slate-200 bg-surface/95' : 'border-surface/80 bg-surface/96',
        )}
      >
        <div>
          <p className="text-[30px] font-extrabold tracking-[-0.04em] text-primary">
            {activeWorkspace === 'sandbox' ? 'PSP' : 'Mini-pay'}
          </p>
          <div className="mt-4 inline-flex items-center rounded-full border border-primary-border bg-primary-surface px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground-strong">
            {workspaceHeadline.title}
          </div>
        </div>

        <div
          className={cn(
            'mt-9 flex-1 rounded-[28px] border p-4',
            isOpsWorkspace
              ? 'border-slate-200 bg-slate-50/70'
              : 'border-primary-border bg-primary-surface-strong',
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground-light">
            {workspaceHeadline.navLabel}
          </p>
          <nav aria-label="Primary" className="mt-3 space-y-1">
            {navigationItems.map((item) => (
              <NavigationButton
                isActive={item.id === activeNavigationId}
                item={item}
                key={item.id}
                onClick={() => onNavigationSelect(item.path)}
              />
            ))}
          </nav>
        </div>

        <WorkspaceSwitcher
          activeWorkspace={activeWorkspace}
          onWorkspaceSelect={onWorkspaceSelect}
          variant="sidebar"
        />
      </div>
    </aside>
  );
}

function NavigationButton({
  isActive,
  item,
  onClick,
}: {
  isActive: boolean;
  item: NavigationItem;
  onClick: () => void;
}): JSX.Element {
  const Icon = item.icon;

  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground shadow-primary-button-small'
          : 'text-muted-foreground hover:bg-surface hover:text-foreground-accent',
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}

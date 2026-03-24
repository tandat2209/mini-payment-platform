import type { JSX } from 'react';

import { cn } from '../../lib/utils';
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
          'sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border p-5 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur',
          isOpsWorkspace ? 'border-slate-200 bg-white/95' : 'border-[#e7e1d8] bg-[#faf7f2]/95',
        )}
      >
        <div>
          <p className="text-[36px] leading-none text-slate-950 [font-family:var(--font-display)]">
            {activeWorkspace === 'sandbox' ? 'PSP' : 'Pay'}
          </p>
          <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {workspaceHeadline.title}
          </div>
        </div>

        <div
          className={cn(
            'mt-8 flex-1 rounded-[24px] border p-4',
            isOpsWorkspace ? 'border-slate-200 bg-slate-50/70' : 'border-[#e7e1d8] bg-white/90',
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
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
        'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
        isActive
          ? 'bg-slate-950 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}

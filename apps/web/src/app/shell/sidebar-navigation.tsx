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
          'sticky top-7 flex h-[calc(100vh-3.5rem)] flex-col rounded-[34px] border p-6 text-slate-900 shadow-[0_24px_70px_rgba(37,87,255,0.10)] backdrop-blur-xl',
          isOpsWorkspace ? 'border-slate-200 bg-white/95' : 'border-white/80 bg-white/96',
        )}
      >
        <div>
          <p className="text-[30px] font-extrabold tracking-[-0.04em] text-[#2557ff]">
            {activeWorkspace === 'sandbox' ? 'PSP' : 'Mini-pay'}
          </p>
          <div className="mt-4 inline-flex items-center rounded-full border border-[#dfe5ff] bg-[#f7f9ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8f9bc3]">
            {workspaceHeadline.title}
          </div>
        </div>

        <div
          className={cn(
            'mt-9 flex-1 rounded-[28px] border p-4',
            isOpsWorkspace ? 'border-slate-200 bg-slate-50/70' : 'border-[#e4e9ff] bg-[#f8faff]',
          )}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#aab4d6]">
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
          ? 'bg-[#2557ff] text-white shadow-[0_14px_30px_rgba(37,87,255,0.24)]'
          : 'text-[#9ba7ca] hover:bg-white hover:text-[#173184]',
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}

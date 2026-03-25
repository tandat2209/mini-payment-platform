import type { JSX } from 'react';

import { cn } from '@/lib/utils';

import {
  getWorkspaceHeadline,
  type NavigationId,
  type NavigationItem,
  type Workspace,
} from './navigation-config';

export function MobileNavigation({
  activeNavigationId,
  activeWorkspace,
  navigationItems,
  onNavigationSelect,
}: {
  activeNavigationId: NavigationId;
  activeWorkspace: Workspace;
  navigationItems: NavigationItem[];
  onNavigationSelect: (path: string) => void;
}): JSX.Element {
  const workspaceHeadline = getWorkspaceHeadline(activeWorkspace);

  return (
    <div className="mb-4 space-y-3 pb-24 lg:hidden">
      <div className="rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {workspaceHeadline.title}
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navigationItems.map((item) => (
            <button
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                item.id === activeNavigationId
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-700',
              )}
              key={item.id}
              onClick={() => onNavigationSelect(item.path)}
              type="button"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

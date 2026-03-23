import type { JSX } from 'react';

import { cn } from '../../lib/utils';
import type { NavigationId, NavigationItem, Workspace } from './navigation-config';
import { adminSandboxNavigationItems, workspaceItems } from './navigation-config';

export function MobileNavigation({
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
  return (
    <div className="mb-4 space-y-3 lg:hidden">
      <div className="rounded-[24px] border border-[#e7e1d8] bg-[#fffdf9]/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {workspaceItems.map((workspace) => {
            const Icon = workspace.icon;
            const isActive = activeWorkspace === workspace.id;

            return (
              <button
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors',
                  isActive
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-700',
                )}
                key={workspace.id}
                onClick={() => onWorkspaceSelect(workspace.id)}
                type="button"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{workspace.label}</p>
                  <p className={cn('mt-1 text-xs', isActive ? 'text-white/75' : 'text-slate-500')}>
                    {workspace.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#e7e1d8] bg-[#fffdf9]/90 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {activeWorkspace === 'admin' ? 'Admin navigation' : 'Customer navigation'}
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

      {activeWorkspace === 'admin' ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
            Sandbox
          </p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {adminSandboxNavigationItems.map((item) => (
              <button
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
                  item.id === activeNavigationId
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-amber-200 bg-white text-slate-700',
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
      ) : null}
    </div>
  );
}

import type { JSX } from 'react';

import { cn } from '../../lib/utils';
import type { NavigationId, NavigationItem, Workspace } from './navigation-config';
import { adminSandboxNavigationItems, workspaceItems } from './navigation-config';

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
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border border-[#e7e1d8] bg-[#faf7f2]/95 p-5 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur">
        <div>
          <p className="text-[36px] leading-none text-slate-950 [font-family:var(--font-display)]">
            Pay
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {activeWorkspace === 'admin'
              ? 'Operational control room for platform finance and simulation.'
              : 'Customer workspace for balances, payouts, recipients, and inbound funding.'}
          </p>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#e7e1d8] bg-white/90 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {activeWorkspace === 'admin' ? 'Admin navigation' : 'Customer navigation'}
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

        <div className="mt-6 rounded-[24px] border border-[#e7e1d8] bg-[linear-gradient(145deg,#fffdf8,#f4efe6)] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {activeWorkspace === 'admin' ? 'Ops posture' : 'Customer posture'}
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-950">
            {activeWorkspace === 'admin' ? 'Dense investigation mode' : 'Action-first account view'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {activeWorkspace === 'admin'
              ? 'Each admin function now lives on its own page, so operators can focus on one workflow at a time.'
              : 'Each customer workflow has its own page, which keeps balances, payout setup, recipients, and funding details easier to reason about.'}
          </p>
        </div>

        {activeWorkspace === 'admin' ? (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              Sandbox
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Simulator controls stay separate from core admin workflows because they are only
              intended for local sandbox usage.
            </p>
            <div className="mt-3 space-y-1">
              {adminSandboxNavigationItems.map((item) => (
                <NavigationButton
                  isActive={item.id === activeNavigationId}
                  item={item}
                  key={item.id}
                  onClick={() => onNavigationSelect(item.path)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto rounded-[24px] border border-[#e7e1d8] bg-white/90 p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#faf7f2] px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
              {activeWorkspace === 'admin' ? 'AD' : 'CU'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {activeWorkspace === 'admin' ? 'Admin workspace' : 'Customer workspace'}
              </p>
              <p className="truncate text-xs text-slate-500">Switch profile context</p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {workspaceItems.map((workspace) => {
              const Icon = workspace.icon;
              const isActive = activeWorkspace === workspace.id;

              return (
                <button
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                    isActive
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                  )}
                  key={workspace.id}
                  onClick={() => onWorkspaceSelect(workspace.id)}
                  type="button"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{workspace.label}</p>
                    <p
                      className={cn(
                        'mt-1 text-xs leading-5',
                        isActive ? 'text-white/75' : 'text-slate-500',
                      )}
                    >
                      {workspace.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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

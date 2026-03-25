import type { JSX } from 'react';

import { cn } from '@/lib/utils';

import { type NavigationId, type NavigationItem, type Workspace } from './navigation-config';

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
  if (activeWorkspace !== 'customer') {
    return <></>;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navigationItems.map((item) => (
          <button
            className={cn(
              'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-colors',
              item.id === activeNavigationId
                ? 'bg-slate-950 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
            )}
            key={item.id}
            onClick={() => onNavigationSelect(item.path)}
            type="button"
          >
            <item.icon className="h-4 w-4" />
            <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

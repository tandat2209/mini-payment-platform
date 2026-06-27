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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-border bg-surface/96 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-2 shadow-mobile-nav backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navigationItems.map((item) => (
          <button
            className={cn(
              'flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-colors',
              item.id === activeNavigationId
                ? 'bg-primary text-primary-foreground shadow-primary-button'
                : 'text-muted-foreground-strong hover:bg-surface-muted hover:text-foreground-accent',
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

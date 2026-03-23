import type { JSX, ReactNode } from 'react';

import { cn } from '../../lib/utils';
import type { ActiveSection } from '../../store/dashboard-store';
import type { AppPage } from './utils';
import { navigationItems } from './utils';

export function DashboardShell({
  activeSection,
  children,
  currentPage,
  onSectionSelect,
}: {
  activeSection: ActiveSection;
  children: ReactNode;
  currentPage: AppPage;
  onSectionSelect: (section: ActiveSection) => void;
}): JSX.Element {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-5 px-4 py-4 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[30px] border border-[#e7e1d8] bg-[#faf7f2]/95 p-5 text-slate-900 shadow-[0_10px_40px_rgba(15,23,42,0.03)] backdrop-blur">
            <div className="flex items-center gap-3">
              <p className="text-[36px] leading-none text-slate-950 [font-family:var(--font-display)]">
                Pay
              </p>
            </div>

            <nav className="mt-10 space-y-1" aria-label="Primary">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === 'dashboard' && item.label === activeSection;

                return (
                  <button
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:bg-white/80 hover:text-slate-950',
                    )}
                    key={item.label}
                    onClick={() => onSectionSelect(item.label)}
                    type="button"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="space-y-5 py-2">{children}</div>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur lg:hidden"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === 'dashboard' && item.label === activeSection;

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium',
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500',
              )}
              key={item.label}
              onClick={() => onSectionSelect(item.label)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

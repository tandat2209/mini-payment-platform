import type { JSX } from 'react';

import type { SummaryMetric } from '@/features/customer/lib/utils';
import { cn } from '@/lib/utils';

export function SummaryFigure({ label, note, tone, value }: SummaryMetric): JSX.Element {
  return (
    <div
      className={cn(
        'space-y-1 px-0 py-1 lg:border-l lg:pl-7',
        tone === 'blue' && 'lg:border-l-[#dfe5ff]',
        tone === 'emerald' && 'lg:border-l-emerald-100',
        tone === 'amber' && 'lg:border-l-amber-100',
        tone === 'slate' && 'lg:border-l-slate-200',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          'text-2xl font-semibold tracking-tight',
          tone === 'emerald' && 'text-emerald-700',
          tone === 'blue' && 'text-[#2557ff]',
          tone === 'amber' && 'text-amber-700',
          tone === 'slate' && 'text-slate-950',
        )}
      >
        {value}
      </p>
      <p className="text-xs text-[#9aa6ca]">{note}</p>
    </div>
  );
}

export function SectionHeader({ action, title }: { action?: string; title: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      {action ? (
        <span className="hidden text-sm font-medium text-[#9aa6ca] sm:inline">{action}</span>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ className }: { className?: string }): JSX.Element {
  return <div className={cn('animate-pulse rounded-xl bg-[#eef2ff]', className)} />;
}

export function EmptyState({ message, title }: { message: string; title: string }): JSX.Element {
  return (
    <div className="rounded-2xl border border-dashed border-[#dfe5ff] bg-[#f7f9ff] p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-[#9aa6ca]">{message}</p>
    </div>
  );
}

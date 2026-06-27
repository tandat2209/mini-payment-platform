import type { HTMLAttributes, JSX } from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'danger' | 'default' | 'positive' | 'warning';
};

export function Badge({
  children,
  className,
  tone = 'default',
  ...props
}: BadgeProps): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tone === 'default' && 'bg-slate-100 text-slate-700',
        tone === 'positive' && 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
        tone === 'warning' && 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70',
        tone === 'danger' && 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

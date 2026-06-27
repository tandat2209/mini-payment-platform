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
        tone === 'default' && 'bg-primary-muted text-foreground-muted',
        tone === 'positive' && 'bg-success-surface text-success ring-1 ring-success-muted/70',
        tone === 'warning' && 'bg-warning-muted text-warning ring-1 ring-warning-border/70',
        tone === 'danger' && 'bg-danger-surface text-danger ring-1 ring-danger-muted/70',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

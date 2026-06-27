import type { ButtonHTMLAttributes, JSX } from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
};

export function Button({
  children,
  className,
  type = 'button',
  variant = 'default',
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border-strong disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' &&
          'border-primary bg-primary text-primary-foreground hover:bg-primary-hover',
        variant === 'secondary' &&
          'border-transparent bg-primary-muted text-foreground-accent hover:bg-primary-muted-hover',
        variant === 'outline' &&
          'border-primary-border bg-surface text-foreground-accent hover:bg-primary-muted hover:text-foreground-accent',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-foreground-muted hover:bg-primary-muted hover:text-foreground-accent',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

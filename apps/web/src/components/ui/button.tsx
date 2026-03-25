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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'border-slate-950 bg-slate-950 text-white hover:bg-slate-800',
        variant === 'secondary' &&
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
        variant === 'outline' && 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

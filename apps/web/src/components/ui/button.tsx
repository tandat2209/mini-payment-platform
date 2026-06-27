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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bfc9ff] disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'border-[#2557ff] bg-[#2557ff] text-white hover:bg-[#173fe6]',
        variant === 'secondary' &&
          'border-transparent bg-[#eef2ff] text-[#173184] hover:bg-[#dfe5ff]',
        variant === 'outline' &&
          'border-[#dfe5ff] bg-white text-[#173184] hover:bg-[#eef2ff] hover:text-[#173184]',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-[#657196] hover:bg-[#eef2ff] hover:text-[#173184]',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

import type { ComponentProps, JSX } from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>): JSX.Element {
  return (
    <input
      className={cn(
        'flex h-11 w-full rounded-xl border border-[#dfe5ff] bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-[#8fa0ff] focus:ring-2 focus:ring-[#dfe5ff] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
        className,
      )}
      {...props}
    />
  );
}

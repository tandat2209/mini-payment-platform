import { hasFlag } from 'country-flag-icons';
import * as Flags from 'country-flag-icons/react/3x2';
import type { ComponentType, JSX, SVGProps } from 'react';

import { cn } from '@/lib/utils';

type FlagComponent = ComponentType<SVGProps<SVGSVGElement>>;

const flagComponents = Flags as Record<string, FlagComponent>;

export function CountryFlag({
  className,
  countryCode,
}: {
  className?: string;
  countryCode: string | null | undefined;
}): JSX.Element {
  const normalizedCountryCode = countryCode?.trim().toUpperCase() ?? '';

  if (!/^[A-Z]{2}$/u.test(normalizedCountryCode) || !hasFlag(normalizedCountryCode)) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-4 w-6 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-100 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500',
          className,
        )}
      >
        --
      </span>
    );
  }

  const Flag = flagComponents[normalizedCountryCode];

  if (!Flag) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-4 w-6 items-center justify-center rounded-[4px] border border-slate-200 bg-slate-100 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500',
          className,
        )}
      >
        --
      </span>
    );
  }

  return (
    <Flag
      aria-hidden="true"
      className={cn('inline-block h-4 w-6 overflow-hidden rounded-[4px] shadow-sm', className)}
    />
  );
}

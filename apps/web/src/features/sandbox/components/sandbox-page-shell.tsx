import type { LucideIcon } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';

export function SandboxPageShell({
  badge,
  children,
  description,
  eyebrow,
  metrics,
  title,
}: {
  badge?: string;
  children: ReactNode;
  description: string;
  eyebrow: string;
  metrics?: Array<{ icon: LucideIcon; label: string; value: string }>;
  title: string;
}): JSX.Element {
  return (
    <div className="space-y-5">
      <Card className="rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            </div>
            {badge ? (
              <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                {badge}
              </div>
            ) : null}
          </div>

          {metrics && metrics.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {metrics.map(({ icon: Icon, label, value }) => (
                <div
                  className="rounded-[22px] border border-slate-200 bg-slate-50/80 px-4 py-4"
                  key={label}
                >
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {children}
    </div>
  );
}

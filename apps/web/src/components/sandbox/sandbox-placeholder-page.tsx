import { Clock3, type LucideIcon } from 'lucide-react';
import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import { SandboxPageShell } from './sandbox-page-shell';

export function SandboxPlaceholderPage({
  cards,
  description,
  eyebrow,
  metrics,
  title,
}: {
  cards: Array<{ icon: LucideIcon; text: string; title: string }>;
  description: string;
  eyebrow: string;
  metrics: Array<{ icon: LucideIcon; label: string; value: string }>;
  title: string;
}): JSX.Element {
  return (
    <SandboxPageShell
      badge="Placeholder"
      description={description}
      eyebrow={eyebrow}
      metrics={metrics}
      title={title}
    >
      <Card className="rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Clock3 className="h-4 w-4" />
            Planned sandbox flow
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {cards.map(({ icon: Icon, text, title: cardTitle }) => (
              <div
                className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4"
                key={cardTitle}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{cardTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SandboxPageShell>
  );
}

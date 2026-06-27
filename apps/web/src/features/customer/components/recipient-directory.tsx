import { Plus, Radio } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import type { RecipientSummary } from '@/features/customer/api';
import { toTitleCase } from '@/features/customer/lib/utils';
import { cn } from '@/lib/utils';

import { EmptyState, LoadingBlock } from './shared';

export function RecipientDirectory({
  isLoading,
  onCreateNew,
  onSelectRecipient,
  recipients,
  selectedRecipientId,
}: {
  isLoading: boolean;
  onCreateNew: () => void;
  onSelectRecipient: (recipientId: string) => void;
  recipients: RecipientSummary[];
  selectedRecipientId: string | null;
}): JSX.Element {
  return (
    <Card className="rounded-[30px] border border-[#dfe5ff] bg-white shadow-[0_18px_50px_rgba(37,87,255,0.07)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
              Recipients
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Beneficiary directory
            </h1>
          </div>
          <Button className="rounded-xl px-4" onClick={onCreateNew} variant="outline">
            <Plus className="h-4 w-4" />
            New recipient
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <LoadingBlock className="h-24" />
            <LoadingBlock className="h-24" />
            <LoadingBlock className="h-24" />
          </div>
        ) : null}

        {!isLoading && recipients.length === 0 ? (
          <EmptyState
            message="Create your first payout destination to reuse it later in payout flows."
            title="No recipients saved yet"
          />
        ) : null}

        {!isLoading ? (
          <div className="space-y-3">
            {recipients.map((recipient) => {
              const isSelected = selectedRecipientId === recipient.id;

              return (
                <button
                  className={cn(
                    'w-full rounded-[24px] border px-4 py-4 text-left transition',
                    isSelected
                      ? 'border-[#8fa0ff] bg-[#f4f7ff] shadow-[0_12px_30px_rgba(37,87,255,0.10)]'
                      : 'border-[#dfe5ff] bg-white hover:border-[#bfc9ff]',
                  )}
                  key={recipient.id}
                  onClick={() => {
                    onSelectRecipient(recipient.id);
                  }}
                  type="button"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-950">{recipient.name}</p>
                        <Badge tone="default">{toTitleCase(recipient.status)}</Badge>
                      </div>
                      <p className="text-sm text-[#9aa6ca]">
                        {recipient.rails.length} saved rail{recipient.rails.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {isSelected ? (
                      <Badge>Selected</Badge>
                    ) : (
                      <span className="text-xs font-medium text-[#a6b0d2]">Add rail</span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {recipient.rails.map((rail) => (
                      <div
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#dfe5ff] bg-[#f7f9ff] px-3 py-2.5"
                        key={rail.id}
                      >
                        <Radio className="h-3.5 w-3.5 text-[#a6b0d2]" />
                        <span className="text-sm font-medium text-slate-900">
                          {toTitleCase(rail.rail)}
                        </span>
                        <Badge tone={rail.payoutReady ? 'positive' : 'warning'}>
                          {formatReadinessStatus(rail.readinessStatus)}
                        </Badge>
                        <span className="text-xs text-[#9aa6ca]">
                          <CountryFlag countryCode={rail.countryCode} /> {rail.countryCode} ·{' '}
                          {rail.currency ?? 'No currency'}
                        </span>
                        <span className="text-xs text-[#9aa6ca]">
                          {rail.providerRegistrationStrategy === 'provider_managed'
                            ? 'Provider managed'
                            : 'Platform managed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatReadinessStatus(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return toTitleCase(value.replace(/_/g, ' '));
}

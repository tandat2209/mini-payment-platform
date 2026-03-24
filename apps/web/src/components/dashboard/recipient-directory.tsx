import { Plus, Radio } from 'lucide-react';
import type { JSX } from 'react';

import type { RecipientSummary } from '../../api';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { EmptyState, LoadingBlock } from './shared';
import { toTitleCase } from './utils';

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
    <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
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
                      ? 'border-emerald-300 bg-emerald-50/50 shadow-[0_10px_25px_rgba(16,185,129,0.08)]'
                      : 'border-slate-200 bg-white hover:border-slate-300',
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
                      <p className="text-sm text-slate-500">
                        {recipient.rails.length} saved rail{recipient.rails.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    {isSelected ? (
                      <Badge tone="positive">Selected</Badge>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Add rail</span>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    {recipient.rails.map((rail) => (
                      <div
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-[#fcfaf6] px-3 py-2.5"
                        key={rail.id}
                      >
                        <Radio className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">
                          {toTitleCase(rail.rail)}
                        </span>
                        <Badge tone={rail.payoutReady ? 'positive' : 'warning'}>
                          {formatReadinessStatus(rail.readinessStatus)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {rail.countryCode} · {rail.currency ?? 'No currency'}
                        </span>
                        <span className="text-xs text-slate-500">
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

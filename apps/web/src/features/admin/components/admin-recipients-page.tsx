import { CreditCard, Globe2, ShieldCheck } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminRecipientItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, getToneFromStatus, toTitleCase } from '@/lib/formatters';

export function AdminRecipientsPage({
  error,
  isLoading,
  recipients,
}: {
  error: string | null;
  isLoading: boolean;
  recipients: AdminRecipientItem[];
}): JSX.Element {
  return (
    <AdminPageShell
      description="Inspect beneficiary readiness, provider registration outcomes, and rail coverage across customers."
      eyebrow="Recipients"
      metrics={[
        {
          icon: CreditCard,
          label: 'Recipients',
          value: isLoading ? 'Loading' : String(recipients.length),
        },
        {
          icon: ShieldCheck,
          label: 'Payout-ready rails',
          value: String(
            recipients.flatMap((item) => item.rails).filter((rail) => rail.payoutReady).length,
          ),
        },
        {
          icon: Globe2,
          label: 'Provider issues',
          value: String(
            recipients
              .flatMap((item) => item.rails)
              .filter((rail) => rail.providerRegistrationError !== null).length,
          ),
        },
      ]}
      title="Recipient registry"
    >
      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {isLoading ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95 xl:col-span-2">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              Loading recipients...
            </CardContent>
          </Card>
        ) : recipients.length === 0 ? (
          <Card className="rounded-[24px] border border-slate-200 bg-white/95 xl:col-span-2">
            <CardContent className="px-5 py-10 text-center text-sm text-slate-500">
              No recipients are available for this admin view.
            </CardContent>
          </Card>
        ) : (
          recipients.map((recipient) => (
            <Card className="rounded-[24px] border border-slate-200 bg-white/95" key={recipient.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-950">{recipient.name}</p>
                      <Badge tone={getToneFromStatus(recipient.status)}>
                        {toTitleCase(recipient.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{recipient.customer.externalRef}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {recipient.createdAt
                      ? formatDate(recipient.createdAt, {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'No timestamp'}
                  </p>
                </div>

                <div className="grid gap-3">
                  {recipient.rails.map((rail) => (
                    <div
                      className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-3"
                      key={rail.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-950">
                          {toTitleCase(rail.rail)} {rail.currency ? `· ${rail.currency}` : ''}
                        </p>
                        <Badge
                          tone={
                            rail.payoutReady ? 'positive' : getToneFromStatus(rail.readinessStatus)
                          }
                        >
                          {toTitleCase(rail.readinessStatus)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {rail.countryCode} ·{' '}
                        {rail.providerRegistrationError ?? 'Ready for payout operations'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}

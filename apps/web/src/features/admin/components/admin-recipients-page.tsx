import { CreditCard, Globe2, ShieldCheck } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { AdminRecipientItem } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatDate, getToneFromStatus, shortenIdentifier, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function AdminRecipientsPage({
  error,
  isLoading,
  recipients,
}: {
  error: string | null;
  isLoading: boolean;
  recipients: AdminRecipientItem[];
}): JSX.Element {
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.id === selectedRecipientId) ?? null,
    [recipients, selectedRecipientId],
  );

  return (
    <AdminPageShell
      description="Inspect beneficiary readiness, provider registration outcomes, and rail coverage."
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
      <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-5 p-5">
          {error ? (
            <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7f9ff]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-[#f4efe7] text-left">
                  <tr>
                    {['Recipient', 'Customer', 'Rails', 'Status', 'Created'].map((header) => (
                      <th
                        className="border-b border-slate-200 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        key={header}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {isLoading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        Loading recipients...
                      </td>
                    </tr>
                  ) : recipients.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                        No recipients are available for this admin view.
                      </td>
                    </tr>
                  ) : (
                    recipients.map((recipient) => (
                      <tr
                        className={cn(
                          'cursor-pointer transition hover:bg-slate-50',
                          selectedRecipientId === recipient.id && 'bg-[#f4f7ff]',
                        )}
                        key={recipient.id}
                        onClick={() =>
                          setSelectedRecipientId((current) =>
                            current === recipient.id ? null : recipient.id,
                          )
                        }
                      >
                        <td className="px-3 py-3 align-top">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-950">{recipient.name}</p>
                            <p className="truncate text-xs text-slate-500">
                              {shortenIdentifier(recipient.id)}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {recipient.customer.externalRef}
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {recipient.rails.length}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge tone={getToneFromStatus(recipient.status)}>
                            {toTitleCase(recipient.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 align-top text-sm text-slate-700">
                          {recipient.createdAt
                            ? formatDate(recipient.createdAt, {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'No timestamp'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet
        onOpenChange={(open) => !open && setSelectedRecipientId(null)}
        open={selectedRecipient !== null}
      >
        <SheetContent
          className="w-full border-l border-slate-200 bg-white p-0 sm:max-w-xl"
          side="right"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Recipient
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {selectedRecipient?.name ?? 'Recipient detail'}
              </h3>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {selectedRecipient ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DetailCard label="Customer" value={selectedRecipient.customer.externalRef} />
                    <DetailCard label="Status" value={toTitleCase(selectedRecipient.status)} />
                    <DetailCard
                      label="Recipient ID"
                      value={shortenIdentifier(selectedRecipient.id)}
                    />
                    <DetailCard
                      label="Created"
                      value={
                        selectedRecipient.createdAt
                          ? formatDate(selectedRecipient.createdAt, {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'No timestamp'
                      }
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Rails
                    </p>
                    <div className="space-y-3">
                      {selectedRecipient.rails.map((rail) => (
                        <div
                          className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4"
                          key={rail.id}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-950">
                              {toTitleCase(rail.rail)} {rail.currency ? `· ${rail.currency}` : ''}
                            </p>
                            <Badge
                              tone={
                                rail.payoutReady
                                  ? 'positive'
                                  : getToneFromStatus(rail.readinessStatus)
                              }
                            >
                              {toTitleCase(rail.readinessStatus)}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <DetailCard label="Country" value={rail.countryCode} />
                            <DetailCard label="Rail ID" value={shortenIdentifier(rail.id)} />
                            <DetailCard
                              label="Payout ready"
                              value={rail.payoutReady ? 'Yes' : 'No'}
                            />
                            <DetailCard
                              label="Provider issue"
                              value={rail.providerRegistrationError ?? 'None'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  );
}

function DetailCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words font-medium text-slate-900">{value}</p>
    </div>
  );
}

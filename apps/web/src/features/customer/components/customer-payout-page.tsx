import { ArrowLeft, ArrowRight, CircleAlert, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import { type JSX, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RecipientSummary, WalletBalance } from '@/features/customer/api';
import { EmptyState, LoadingBlock } from '@/features/customer/components/shared';
import { formatMoney, formatMoneyFromMinor, toTitleCase } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type ReadyRail = RecipientSummary['rails'][number] & {
  recipientId: string;
  recipientName: string;
};

const STEPS = [
  { id: 'recipient', label: 'Recipient' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
] as const;

export function CustomerPayoutPage({
  isRecipientsLoading,
  onBack,
  onManageRecipients,
  recipients,
  visibleBalances,
}: {
  isRecipientsLoading: boolean;
  onBack: () => void;
  onManageRecipients: () => void;
  recipients: RecipientSummary[];
  visibleBalances: WalletBalance[];
}): JSX.Element {
  const [step, setStep] = useState(0);
  const [selectedRailId, setSelectedRailId] = useState<string | null>(null);
  const [selectedSourceCurrency, setSelectedSourceCurrency] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');

  const readyRails = useMemo<ReadyRail[]>(() => {
    return recipients.flatMap((recipient) =>
      recipient.rails
        .filter((rail) => rail.payoutReady)
        .map((rail) => ({
          ...rail,
          recipientId: recipient.id,
          recipientName: recipient.name,
        })),
    );
  }, [recipients]);

  const blockedRails = useMemo<ReadyRail[]>(() => {
    return recipients.flatMap((recipient) =>
      recipient.rails
        .filter((rail) => !rail.payoutReady)
        .map((rail) => ({
          ...rail,
          recipientId: recipient.id,
          recipientName: recipient.name,
        })),
    );
  }, [recipients]);

  const selectedRail = readyRails.find((rail) => rail.id === selectedRailId) ?? null;

  const sourceBalances = useMemo(() => {
    if (!selectedRail) {
      return visibleBalances;
    }

    const matchingBalances = visibleBalances.filter(
      (balance) => balance.currency === selectedRail.currency,
    );

    return matchingBalances.length > 0 ? matchingBalances : visibleBalances;
  }, [selectedRail, visibleBalances]);

  const effectiveSourceCurrency = selectedSourceCurrency;
  const selectedSourceBalance =
    sourceBalances.find((balance) => balance.currency === effectiveSourceCurrency) ?? null;

  const amountMinor = parseAmountToMinor(amount);
  const amountCurrency = selectedRail?.currency ?? selectedSourceBalance?.currency ?? 'USD';
  const amountPreview =
    amountMinor > 0 ? formatMoneyFromMinor(amountMinor, amountCurrency) : 'Enter amount';

  const canContinueFromRecipient = selectedRail !== null;
  const canContinueFromDetails = selectedSourceBalance !== null && amountMinor > 0n;
  const primaryActionDisabled =
    (step === 0 && !canContinueFromRecipient) || (step === 1 && !canContinueFromDetails);
  const primaryActionLabel = step < 2 ? 'Continue' : 'Execution API coming next';

  function handleAdvance(): void {
    if (step === 0 && canContinueFromRecipient) {
      setStep(1);
      return;
    }

    if (step === 1 && canContinueFromDetails) {
      setStep(2);
      return;
    }
  }

  function handleBackStep(): void {
    if (step === 0) {
      onBack();
      return;
    }

    setStep((currentStep) => currentStep - 1);
  }

  return (
    <section
      className="space-y-4 pb-[calc(var(--customer-mobile-payout-action-offset)+1rem)] lg:pb-0"
      id="section-payout"
    >
      <Card className="overflow-hidden rounded-[26px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_16px_55px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-6 p-4 sm:p-5 lg:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button className="rounded-xl px-3.5" onClick={onBack} variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Badge tone="default">Saved rails only</Badge>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Payout
              </p>
              <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Send payout
              </h1>
              <p className="max-w-xl text-sm text-slate-500">
                Choose a saved recipient, enter details, then review.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {STEPS.map((stepItem, index) => {
                const isActive = step === index;
                const isComplete = step > index;

                return (
                  <div
                    className={cn(
                      'rounded-[18px] border px-3 py-2.5 transition',
                      isActive && 'border-slate-950 bg-slate-950 text-white',
                      isComplete && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                      !isActive && !isComplete && 'border-slate-200 bg-white text-slate-500',
                    )}
                    key={stepItem.id}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                      Step {index + 1}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">{stepItem.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="rounded-[22px] border border-[#ebe4d8] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] sm:p-5">
              {isRecipientsLoading ? (
                <div className="space-y-4">
                  <LoadingBlock className="h-12" />
                  <LoadingBlock className="h-24" />
                  <LoadingBlock className="h-24" />
                </div>
              ) : null}

              {!isRecipientsLoading && readyRails.length === 0 ? (
                <EmptyState
                  message="Add and activate at least one payout-ready recipient rail before starting a payout."
                  title="No payout-ready destinations"
                />
              ) : null}

              {!isRecipientsLoading && readyRails.length > 0 ? (
                <>
                  {step === 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-950">Recipient</h2>
                        </div>
                        <Button
                          className="rounded-xl px-3.5"
                          onClick={onManageRecipients}
                          variant="outline"
                        >
                          Manage
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {readyRails.map((rail) => {
                          const isSelected = rail.id === selectedRailId;

                          return (
                            <button
                              className={cn(
                                'w-full rounded-[20px] border px-3.5 py-3.5 text-left transition',
                                isSelected
                                  ? 'border-slate-950 bg-slate-950 text-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]'
                                  : 'border-slate-200 bg-[#fcfaf7] hover:border-slate-300',
                              )}
                              key={rail.id}
                              onClick={() => {
                                setSelectedRailId(rail.id);
                                setSelectedSourceCurrency(null);
                              }}
                              type="button"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <CountryFlag
                                      countryCode={rail.countryCode}
                                      className="h-4 w-6 rounded-sm"
                                    />
                                    <span className="text-base font-semibold">
                                      {rail.recipientName}
                                    </span>
                                    <Badge tone={isSelected ? 'default' : 'positive'}>Active</Badge>
                                  </div>
                                  <p
                                    className={cn(
                                      'text-sm',
                                      isSelected ? 'text-slate-200' : 'text-slate-500',
                                    )}
                                  >
                                    {toTitleCase(rail.rail)} · {rail.countryCode} · {rail.currency}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    'rounded-full px-3 py-1 text-xs font-semibold',
                                    isSelected
                                      ? 'bg-white/12 text-white'
                                      : 'bg-slate-100 text-slate-600',
                                  )}
                                >
                                  {rail.providerRegistrationStrategy === 'provider_managed'
                                    ? 'Registered with provider'
                                    : 'Platform managed'}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-950">Payout details</h2>
                      </div>

                      <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <CountryFlag
                            countryCode={selectedRail?.countryCode ?? 'US'}
                            className="h-4 w-6 rounded-sm"
                          />
                          <p className="font-semibold text-slate-950">
                            {selectedRail?.recipientName}
                          </p>
                          <Badge tone="positive">
                            {selectedRail ? toTitleCase(selectedRail.rail) : 'Rail'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {selectedRail?.countryCode} · {selectedRail?.currency} · Saved payout
                          destination
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700">
                            Source balance
                          </span>
                          <Select
                            onValueChange={(value) => {
                              setSelectedSourceCurrency(value);
                            }}
                            {...(effectiveSourceCurrency ? { value: effectiveSourceCurrency } : {})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source balance" />
                            </SelectTrigger>
                            <SelectContent>
                              {sourceBalances.map((balance) => (
                                <SelectItem key={balance.currency} value={balance.currency}>
                                  {balance.currency} · {formatMoney(balance.available)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>

                        <label className="space-y-2">
                          <span className="text-sm font-semibold text-slate-700">Amount</span>
                          <Input
                            inputMode="decimal"
                            onChange={(event) => {
                              setAmount(event.target.value);
                            }}
                            placeholder="0.00"
                            value={amount}
                          />
                        </label>
                      </div>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Reference
                          <span className="ml-2 text-xs font-medium text-slate-400">Optional</span>
                        </span>
                        <Input
                          maxLength={80}
                          onChange={(event) => {
                            setReference(event.target.value);
                          }}
                          placeholder="Invoice, purpose, or internal note"
                          value={reference}
                        />
                      </label>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-xl font-semibold text-slate-950">Review payout</h2>
                      </div>

                      <div className="grid gap-3">
                        <ReviewRow
                          label="Recipient"
                          value={selectedRail?.recipientName ?? 'No recipient selected'}
                        />
                        <ReviewRow
                          label="Rail"
                          value={
                            selectedRail
                              ? `${toTitleCase(selectedRail.rail)} · ${selectedRail.countryCode} · ${selectedRail.currency}`
                              : 'No rail selected'
                          }
                        />
                        <ReviewRow
                          label="Source balance"
                          value={
                            selectedSourceBalance
                              ? `${selectedSourceBalance.currency} · ${formatMoney(selectedSourceBalance.available)} available`
                              : 'No source selected'
                          }
                        />
                        <ReviewRow label="Amount" value={amountPreview} />
                        <ReviewRow
                          label="Reference"
                          value={reference.trim() || 'No reference added'}
                        />
                      </div>

                      <div className="rounded-[20px] border border-slate-200 bg-[#fcfaf7] p-3.5 text-sm text-slate-600">
                        Final execution is not live yet.
                      </div>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="space-y-4">
              <Card className="rounded-[22px] border border-[#e7e1d8] bg-[#fcfaf6] shadow-none">
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Landmark className="h-4 w-4" />
                    <p className="text-sm font-semibold">Summary</p>
                  </div>

                  <SummaryMetric
                    label="Destination"
                    value={selectedRail?.recipientName ?? 'Choose a recipient'}
                  />
                  <SummaryMetric
                    label="Source"
                    value={selectedSourceBalance?.currency ?? 'Select balance'}
                  />
                  <SummaryMetric label="Amount" value={amountPreview} />
                </CardContent>
              </Card>

              <Card className="rounded-[22px] border border-[#e7e1d8] bg-white shadow-none">
                <CardContent className="space-y-3.5 p-4">
                  <div className="flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-4 w-4" />
                    <p className="text-sm font-semibold">Checks</p>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600">
                    <StatusLine
                      icon={<Sparkles className="h-4 w-4" />}
                      text="Only payout-ready rails can be used."
                    />
                    <StatusLine
                      icon={<ShieldCheck className="h-4 w-4" />}
                      text="Recipient details stay locked to the saved rail."
                    />
                    <StatusLine
                      icon={<CircleAlert className="h-4 w-4" />}
                      text={`${blockedRails.length} blocked rail${blockedRails.length === 1 ? '' : 's'} need attention.`}
                    />
                  </div>

                  {blockedRails.length > 0 ? (
                    <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                        Exceptions
                      </p>
                      <div className="mt-3 space-y-2">
                        {blockedRails.slice(0, 3).map((rail) => (
                          <div
                            className="flex items-center justify-between gap-3 text-sm"
                            key={rail.id}
                          >
                            <span className="truncate text-slate-700">
                              {rail.recipientName} · {toTitleCase(rail.rail)}
                            </span>
                            <span className="shrink-0 text-amber-700">
                              {formatReadinessStatus(rail.readinessStatus)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-3 border-t border-[#ece6dd] pt-6 lg:flex">
            <Button className="rounded-xl px-4" onClick={handleBackStep} variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Back to overview' : 'Previous'}
            </Button>

            {step < 2 ? (
              <Button
                className="rounded-xl px-5"
                disabled={primaryActionDisabled}
                onClick={handleAdvance}
              >
                {primaryActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="rounded-xl px-5" disabled>
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-[var(--customer-mobile-payout-action-offset)] z-30 px-4 lg:hidden">
        <div className="mx-auto max-w-[680px] rounded-[22px] border border-slate-200/90 bg-white/96 p-2 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="grid grid-cols-[auto_1fr] gap-2">
            <Button className="min-h-11 rounded-xl px-3.5" onClick={handleBackStep} variant="ghost">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {step < 2 ? (
              <Button
                className="min-h-11 rounded-xl px-4"
                disabled={primaryActionDisabled}
                onClick={handleAdvance}
              >
                {primaryActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="min-h-11 rounded-xl px-4" disabled>
                {primaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-[#fcfaf7] px-3.5 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function StatusLine({ icon, text }: { icon: JSX.Element; text: string }): JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function parseAmountToMinor(value: string): bigint {
  const trimmedValue = value.trim();

  if (!trimmedValue || !/^\d+(\.\d{0,2})?$/.test(trimmedValue)) {
    return 0n;
  }

  const [wholeValue = '0', fractionalPart = ''] = trimmedValue.split('.');
  const wholePart = wholeValue;
  return BigInt(wholePart) * 100n + BigInt((fractionalPart + '00').slice(0, 2));
}

function formatReadinessStatus(value: string | null | undefined): string {
  if (!value) {
    return 'Unknown';
  }

  return toTitleCase(value.replace(/_/g, ' '));
}

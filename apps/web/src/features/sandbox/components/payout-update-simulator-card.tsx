import { LoaderCircle, Radar, RefreshCcw, RotateCcw, Siren } from 'lucide-react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  SandboxPayoutUpdateFormState,
  SandboxPayoutUpdateResult,
} from '@/features/sandbox/data/sandbox-data';
import { toTitleCase } from '@/lib/formatters';

export function PayoutUpdateSimulatorCard({
  error,
  formState,
  isSubmitting,
  onChange,
  onSubmit,
  result,
}: {
  error: string | null;
  formState: SandboxPayoutUpdateFormState;
  isSubmitting: boolean;
  onChange: (field: keyof SandboxPayoutUpdateFormState, value: string) => void;
  onSubmit: () => Promise<void> | void;
  result: SandboxPayoutUpdateResult | null;
}): JSX.Element {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              PSP sandbox
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Payout callback dispatch
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Send provider-style payout status updates into the payout webhook endpoint using a
              submitted PSP sandbox payout id.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            <Radar className="h-3.5 w-3.5" />
            Manual callback
          </div>
        </div>

        <form
          className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 rounded-[26px] border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <Field
              label="External payout id"
              onChange={(event) => onChange('externalPayoutId', event.target.value)}
              placeholder="ppay_1234abcd..."
              value={formState.externalPayoutId}
            />
            <SelectField
              label="Update status"
              onChange={(event) => onChange('status', event.target.value)}
              options={[
                { label: 'Processing', value: 'processing' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
                { label: 'Returned', value: 'returned' },
              ]}
              value={formState.status}
            />
            <Field
              label="External event id"
              onChange={(event) => onChange('externalEventId', event.target.value)}
              placeholder="evt_payout_manual_001"
              value={formState.externalEventId}
            />
            <Field
              label={formState.status === 'returned' ? 'Return reason' : 'Failure reason'}
              onChange={(event) => onChange('failureReason', event.target.value)}
              placeholder={
                formState.status === 'returned'
                  ? 'Destination bank returned the payout'
                  : 'Beneficiary bank rejected the payout'
              }
              value={formState.failureReason}
            />
            {formState.status === 'returned' ? (
              <Field
                label="Returned amount minor"
                onChange={(event) => onChange('returnedAmountMinor', event.target.value)}
                placeholder="2503"
                value={formState.returnedAmountMinor}
              />
            ) : null}

            <div className="sm:col-span-2 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Use the PSP external payout id returned at submission time, like `ppay_...`. Failed
              updates can carry a provider reason. Returned events also need the actual returned
              amount from the provider.
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                {formState.status === 'returned' ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Callback request
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Status: {toTitleCase(formState.status)}</p>
                <p>
                  {formState.status === 'returned' ? 'Return reason' : 'Failure reason'}:{' '}
                  {formState.status === 'failed' || formState.status === 'returned'
                    ? formState.failureReason.trim() || 'Recommended'
                    : 'Not sent'}
                </p>
                <p>
                  Returned amount:{' '}
                  {formState.status === 'returned'
                    ? formState.returnedAmountMinor.trim() || 'Required'
                    : 'Not sent'}
                </p>
              </div>
              <Button className="mt-5 w-full rounded-2xl" disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {formState.status === 'returned'
                      ? 'Sending payout return...'
                      : 'Sending payout update...'}
                  </>
                ) : formState.status === 'returned' ? (
                  'Send payout return'
                ) : (
                  'Send payout update'
                )}
              </Button>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Last result
              </p>
              {result ? (
                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  <ResultRow label="Status" value={toTitleCase(result.status)} />
                  <ResultRow label="Provider" value={result.provider} />
                  <ResultRow label="Payout reference" value={result.payoutReference} />
                  <ResultRow label="External event" value={result.externalEventId} />
                  {result.returnedAmountMinor ? (
                    <ResultRow label="Returned amount minor" value={result.returnedAmountMinor} />
                  ) : null}
                  <ResultRow label="Delivery target" value={result.deliveryTarget} />
                  <ResultRow
                    label="Receiver duplicate"
                    value={
                      result.receiverDuplicate === null
                        ? 'Unknown'
                        : String(result.receiverDuplicate)
                    }
                  />
                  <ResultRow
                    label="Receiver status"
                    value={result.receiverProcessingStatus ?? 'Unknown'}
                  />
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  No payout update sent yet. Dispatch a callback to push a real provider lifecycle
                  event into the API.
                </p>
              )}

              {error ? (
                <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <div className="flex items-start gap-2">
                    <Siren className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  value: string;
}): JSX.Element {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}): JSX.Element {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <select
        className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResultRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-slate-950">{value}</dd>
    </div>
  );
}

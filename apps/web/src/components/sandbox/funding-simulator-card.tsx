import { LoaderCircle, Radar, Sparkles } from 'lucide-react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type {
  SandboxFundingSimulationFormState,
  SandboxFundingSimulationResult,
} from './sandbox-data';

export function FundingSimulatorCard({
  error,
  formState,
  isSubmitting,
  onChange,
  onSubmit,
  result,
}: {
  error: string | null;
  formState: SandboxFundingSimulationFormState;
  isSubmitting: boolean;
  onChange: (field: keyof SandboxFundingSimulationFormState, value: string) => void;
  onSubmit: () => Promise<void> | void;
  result: SandboxFundingSimulationResult | null;
}): JSX.Element {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Card className="rounded-[30px] border border-[#d9d3c8] bg-[linear-gradient(145deg,#fffdf8,#f6f1e7)] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              PSP sandbox
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Funding webhook dispatch
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Send provider-style inbound funding events directly to the PSP sandbox service.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            Sandbox mode
          </div>
        </div>

        <form
          className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 rounded-[26px] border border-[#e4ddd2] bg-white/90 p-4 sm:grid-cols-2">
            <Field
              label="Amount minor"
              onChange={(event) => onChange('amountMinor', event.target.value)}
              value={formState.amountMinor}
            />
            <Field
              label="Currency"
              onChange={(event) => onChange('currency', event.target.value.toUpperCase())}
              value={formState.currency}
            />
            <SelectField
              label="Destination type"
              onChange={(event) => onChange('destinationType', event.target.value)}
              options={[
                { label: 'Account number', value: 'account_number' },
                { label: 'IBAN', value: 'iban' },
                { label: 'Virtual account', value: 'virtual_account' },
              ]}
              value={formState.destinationType}
            />
            <Field
              label="Destination identifier"
              onChange={(event) => onChange('destinationIdentifier', event.target.value)}
              value={formState.destinationIdentifier}
            />
            <Field
              label="Provider reference"
              onChange={(event) => onChange('providerReference', event.target.value)}
              value={formState.providerReference}
            />
            <Field
              label="External event id"
              onChange={(event) => onChange('externalEventId', event.target.value)}
              value={formState.externalEventId}
            />
            <Field
              label="Sender name"
              onChange={(event) => onChange('senderName', event.target.value)}
              value={formState.senderName}
            />
            <Field
              label="Sender account"
              onChange={(event) => onChange('senderAccountIdentifier', event.target.value)}
              value={formState.senderAccountIdentifier}
            />
            <Field
              label="Sender bank"
              onChange={(event) => onChange('senderBankName', event.target.value)}
              value={formState.senderBankName}
            />
            <Field
              label="Sender bank code"
              onChange={(event) => onChange('senderBankCode', event.target.value)}
              value={formState.senderBankCode}
            />
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Description
              </label>
              <textarea
                className="mt-2 min-h-28 w-full rounded-[22px] border border-slate-200 bg-[#fcfaf6] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                onChange={(event) => onChange('description', event.target.value)}
                placeholder="Funding description or remittance"
                value={formState.description}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-[#d7d3cc] bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                <Radar className="h-4 w-4" />
                Dispatch request
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                This sends the provider-style payload straight to the PSP sandbox service, which
                then delivers the webhook into the API.
              </p>
              <Button className="mt-5 w-full rounded-2xl" disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Dispatching event...
                  </>
                ) : (
                  'Send funding webhook'
                )}
              </Button>
            </div>

            <div className="rounded-[26px] border border-[#d7d3cc] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Last result
              </p>
              {result ? (
                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  <ResultRow label="Status" value={result.status} />
                  <ResultRow label="Provider" value={result.provider} />
                  <ResultRow label="External event" value={result.externalEventId} />
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
                  No sandbox event sent yet. Submit a funding webhook to see the delivery result
                  from the PSP sandbox.
                </p>
              )}

              {error ? (
                <div className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {error}
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
  value,
}: {
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
}): JSX.Element {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <input
        className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-[#fcfaf6] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        onChange={onChange}
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
        className="mt-2 h-12 w-full rounded-[18px] border border-slate-200 bg-[#fcfaf6] px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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

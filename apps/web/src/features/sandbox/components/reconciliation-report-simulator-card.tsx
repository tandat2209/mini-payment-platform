import { CalendarDays, LoaderCircle, ReceiptText, Siren } from 'lucide-react';
import type { ChangeEvent, FormEvent, JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type {
  SandboxReconciliationReportFormState,
  SandboxReconciliationReportResult,
} from '@/features/sandbox/data/sandbox-data';
import { formatDate } from '@/lib/formatters';

export function ReconciliationReportSimulatorCard({
  error,
  formState,
  isSubmitting,
  onChange,
  onSubmit,
  result,
}: {
  error: string | null;
  formState: SandboxReconciliationReportFormState;
  isSubmitting: boolean;
  onChange: (field: keyof SandboxReconciliationReportFormState, value: string) => void;
  onSubmit: () => Promise<void> | void;
  result: SandboxReconciliationReportResult | null;
}): JSX.Element {
  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void onSubmit();
  }

  return (
    <Card className="rounded-[30px] border border-slate-200 bg-white/95 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              PSP sandbox
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Reconciliation report dispatch
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Generate one provider reconciliation batch for a report date and send it to the API
              reconciliation webhook.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <ReceiptText className="h-3.5 w-3.5" />
            Daily batch
          </div>
        </div>

        <form
          className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 rounded-[26px] border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
            <Field
              label="Report date"
              onChange={(event) => onChange('reportDate', event.target.value)}
              placeholder="2026-03-29"
              value={formState.reportDate}
            />
            <Field
              label="Provider report id"
              onChange={(event) => onChange('providerReportId', event.target.value)}
              placeholder="rpt_20260329_psp_sandbox"
              value={formState.providerReportId}
            />
            <Field
              label="External event id"
              onChange={(event) => onChange('externalEventId', event.target.value)}
              placeholder="evt_sandbox_reconciliation_001"
              value={formState.externalEventId}
            />
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:col-span-2">
              The sandbox will collect funding, payout, and return activity for the selected date,
              package it into one provider report, and deliver it to
              `/webhooks/reconciliation-reports`.
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                <CalendarDays className="h-4 w-4" />
                Report request
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Date: {formState.reportDate || 'Required'}</p>
                <p>Report id: {formState.providerReportId.trim() || 'Auto-generate'}</p>
                <p>Event id: {formState.externalEventId.trim() || 'Auto-generate'}</p>
              </div>
              <Button className="mt-5 w-full rounded-2xl" disabled={isSubmitting} type="submit">
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Sending reconciliation report...
                  </>
                ) : (
                  'Send reconciliation report'
                )}
              </Button>
            </div>

            <div className="rounded-[26px] border border-slate-200 bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Last result
              </p>
              {result ? (
                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  <ResultRow label="Report id" value={result.providerReportId} />
                  <ResultRow label="Report date" value={result.reportDate} />
                  <ResultRow label="Line count" value={result.lineCount} />
                  <ResultRow label="External event" value={result.externalEventId} />
                  <ResultRow
                    label="Delivered at"
                    value={formatDate(result.postedAt, {
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                    })}
                  />
                  <ResultRow
                    label="Receiver status"
                    value={result.receiverProcessingStatus ?? 'Unknown'}
                  />
                  <ResultRow
                    label="Receiver duplicate"
                    value={
                      result.receiverDuplicate === null
                        ? 'Unknown'
                        : String(result.receiverDuplicate)
                    }
                  />
                </dl>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  No reconciliation report sent yet.
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

function ResultRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] text-right font-medium text-slate-950">{value}</dd>
    </div>
  );
}

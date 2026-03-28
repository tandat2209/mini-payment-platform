import { AlertTriangle, CheckCircle2, Eye, XCircle } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminBalanceSummaryItem, MoneyDto } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatMoney } from '@/lib/formatters';

export function AdminBalancesPage({
  balances,
  error,
  isLoading,
  onOpenLedger,
}: {
  balances: AdminBalanceSummaryItem[];
  error: string | null;
  isLoading: boolean;
  onOpenLedger: (currency: string) => void;
}): JSX.Element {
  return (
    <AdminPageShell
      description="Accounting and treasury integrity by currency."
      eyebrow="Treasury"
      title="Treasury balances"
    >
      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <CardContent className="px-5 py-12 text-center text-sm text-slate-500">
            Loading treasury positions...
          </CardContent>
        </Card>
      ) : balances.length === 0 ? (
        <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <CardContent className="px-5 py-12 text-center text-sm text-slate-500">
            No treasury balances are available for this admin view.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {balances.map((section) => (
            <Card
              className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]"
              key={section.currency}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Currency
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {section.currency}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="default">{section.activeWalletCount} wallets</Badge>
                    <StatusBadge
                      isHealthy={section.accountingIntegrity.isBalanced}
                      negativeLabel="Accounting issue"
                      positiveLabel="Accounting OK"
                    />
                    <StatusBadge
                      isHealthy={section.businessIntegrity.isHealthy}
                      negativeLabel="Business issue"
                      positiveLabel="Business OK"
                    />
                    <Button
                      className="h-8 rounded-full px-3"
                      onClick={() => onOpenLedger(section.currency)}
                      type="button"
                      variant="outline"
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Ledger
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-4">
                  <ValueCard label="Wallet available" value={formatMoney(section.available)} />
                  <ValueCard label="Wallet pending" value={formatMoney(section.pending)} />
                  <IntegrityCard
                    detail={`${formatMoney(section.accountingIntegrity.trialBalanceDelta)} delta`}
                    icon={
                      section.accountingIntegrity.isBalanced ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-rose-600" />
                      )
                    }
                    label="Accounting integrity"
                    tone={section.accountingIntegrity.isBalanced ? 'positive' : 'warning'}
                    value={
                      section.accountingIntegrity.unbalancedJournalCount === 0
                        ? 'All journals balanced'
                        : `${section.accountingIntegrity.unbalancedJournalCount} journals out`
                    }
                  />
                  <IntegrityCard
                    detail={
                      section.businessIntegrity.isHealthy
                        ? 'Wallets and payout reserves line up'
                        : `${section.businessIntegrity.issues.length} issues need review`
                    }
                    icon={
                      section.businessIntegrity.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )
                    }
                    label="Business integrity"
                    tone={section.businessIntegrity.isHealthy ? 'positive' : 'warning'}
                    value={
                      section.businessIntegrity.isHealthy
                        ? 'Operationally healthy'
                        : 'Operational review needed'
                    }
                  />
                </div>

                <div
                  className={
                    section.accountingIntegrity.isBalanced && section.businessIntegrity.isHealthy
                      ? 'rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4'
                      : 'rounded-[24px] border border-amber-200 bg-amber-50/70 p-4'
                  }
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {section.accountingIntegrity.isBalanced &&
                      section.businessIntegrity.isHealthy ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                      <p className="text-sm font-semibold text-slate-950">
                        Platform Cash = Platform Revenue + Recipient Payables + Wallet Liabilities
                      </p>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-stretch">
                      <FormulaCard
                        accent="positive"
                        label="Platform Cash"
                        value={formatMoney(section.positions.platformCash)}
                      />
                      <div className="hidden items-center justify-center text-2xl font-semibold text-slate-400 xl:flex">
                        =
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <FormulaCard
                          accent="default"
                          label="Platform Revenue"
                          value={formatMoney(section.positions.platformRevenue)}
                        />
                        <FormulaCard
                          accent="default"
                          label="Recipient Payables"
                          value={formatMoney(section.positions.recipientPayables)}
                        />
                        <FormulaCard
                          accent="default"
                          label="Wallet Liabilities"
                          value={formatMoney(section.positions.walletLiabilities)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {section.businessIntegrity.issues.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {section.businessIntegrity.issues.map((issue) => (
                      <IssueBadge issue={issue} key={`${section.currency}-${issue.code}`} />
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

function StatusBadge({
  isHealthy,
  negativeLabel,
  positiveLabel,
}: {
  isHealthy: boolean;
  negativeLabel: string;
  positiveLabel: string;
}): JSX.Element {
  return (
    <Badge tone={isHealthy ? 'positive' : 'warning'}>
      {isHealthy ? positiveLabel : negativeLabel}
    </Badge>
  );
}

function ValueCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#fcfaf6] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function IntegrityCard({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: JSX.Element;
  label: string;
  tone: 'positive' | 'warning';
  value: string;
}): JSX.Element {
  return (
    <div
      className={
        tone === 'positive'
          ? 'rounded-[22px] border border-emerald-200 bg-emerald-50/50 px-4 py-4'
          : 'rounded-[22px] border border-amber-200 bg-amber-50/50 px-4 py-4'
      }
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>
      <p className="mt-3 text-lg font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function FormulaCard({
  accent,
  label,
  value,
}: {
  accent: 'default' | 'positive';
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div
      className={
        accent === 'positive'
          ? 'rounded-[20px] border border-emerald-200 bg-white px-4 py-4'
          : 'rounded-[20px] border border-slate-200 bg-white px-4 py-4'
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function IssueBadge({
  issue,
}: {
  issue: AdminBalanceSummaryItem['businessIntegrity']['issues'][number];
}): JSX.Element {
  const suffix = issue.count
    ? `${issue.count}`
    : issue.value
      ? formatIssueValue(issue.code, issue.value)
      : null;

  return (
    <div
      className={
        issue.severity === 'high'
          ? 'inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700'
          : 'inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700'
      }
    >
      <span>{issue.summary}</span>
      {suffix ? <span className="font-semibold">{suffix}</span> : null}
    </div>
  );
}

function formatIssueValue(code: string, value: MoneyDto): string {
  if (code === 'wallet_exposure_mismatch' || code === 'recipient_payables_mismatch') {
    const formatted = formatMoney(value);
    return formatted.startsWith('-') ? formatted : `±${formatted}`;
  }

  return formatMoney(value);
}

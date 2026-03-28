import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AdminBalanceSummaryItem, AdminLedgerListResponse } from '@/features/admin/api';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';
import { formatMoney, formatMoneyFromMinor } from '@/lib/formatters';

export function AdminBalancesPage({
  balances,
  error,
  isLoading,
  ledgerSummary,
  onOpenLedger,
}: {
  balances: AdminBalanceSummaryItem[];
  error: string | null;
  isLoading: boolean;
  ledgerSummary: AdminLedgerListResponse['summary'] | null;
  onOpenLedger: (currency: string) => void;
}): JSX.Element {
  const currencySections = buildTreasuryCurrencySections(balances, ledgerSummary);

  return (
    <AdminPageShell
      description="Currency-first treasury positions."
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
      ) : currencySections.length === 0 ? (
        <Card className="rounded-[30px] border border-slate-200 bg-white/92 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <CardContent className="px-5 py-12 text-center text-sm text-slate-500">
            No treasury balances are available for this admin view.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5">
          {currencySections.map((section) => (
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
                    <Badge tone={section.health.isBalanced ? 'positive' : 'warning'}>
                      {section.health.isBalanced ? 'Balanced' : 'Needs review'}
                    </Badge>
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

                <div className="grid gap-3 lg:grid-cols-3">
                  <HighlightCard label="Wallet available" value={formatMoney(section.available)} />
                  <HighlightCard label="Wallet pending" value={formatMoney(section.pending)} />
                  <HighlightCard label="Trial balance" value={section.health.delta} />
                </div>

                <div
                  className={
                    section.health.isBalanced
                      ? 'rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-4'
                      : 'rounded-[24px] border border-amber-200 bg-amber-50/80 p-4'
                  }
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {section.health.isBalanced ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-amber-600" />
                        )}
                        <p className="text-base font-semibold text-slate-950">
                          {section.health.isBalanced ? 'Balanced' : 'Needs review'}
                        </p>
                      </div>
                      {section.unbalancedTransactions > 0 ? (
                        <Badge tone="warning">
                          {section.unbalancedTransactions} unbalanced journals
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr] xl:items-stretch">
                      <EquationCard
                        accent={section.health.isBalanced ? 'positive' : 'default'}
                        label="Platform Cash"
                        value={getGroupEquationValue(section.groupRows, 'Platform cash')}
                      />
                      <div className="hidden items-center justify-center text-2xl font-semibold text-slate-400 xl:flex">
                        =
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <EquationCard
                          accent="default"
                          label="Platform Revenue"
                          value={getGroupEquationValue(section.groupRows, 'Platform revenue')}
                        />
                        <EquationCard
                          accent="default"
                          label="Recipient Payables"
                          value={getGroupEquationValue(section.groupRows, 'Recipient payables')}
                        />
                        <EquationCard
                          accent="default"
                          label="Wallet Liabilities"
                          value={getGroupEquationValue(section.groupRows, 'Wallet liabilities')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}

type TreasuryCurrencySection = {
  accountRows: Array<{
    accountCode: string;
    accountGroup: string;
    accountType: string;
    balance: {
      formatted: string;
      side: 'credit' | 'debit';
    };
    equationContributionMinor: bigint;
    equationEffect: string;
    credits: AdminLedgerListResponse['summary']['trialBalanceRows'][number]['credits'];
    debits: AdminLedgerListResponse['summary']['trialBalanceRows'][number]['debits'];
    displayName: string;
    referenceLabel: string | null;
  }>;
  activeWalletCount: number;
  available: AdminBalanceSummaryItem['available'];
  currency: string;
  groupRows: Array<{
    accountCount: number;
    accountGroup: string;
    balance: {
      formatted: string;
      side: 'credit' | 'debit';
    };
    equationContributionMinor: bigint;
    equationEffect: string;
    credits: AdminLedgerListResponse['summary']['accountGroupSummaries'][number]['credits'];
    debits: AdminLedgerListResponse['summary']['accountGroupSummaries'][number]['debits'];
    description: string;
  }>;
  health: {
    counterpartyTotal: string;
    credits: string;
    debitSideTotal: string;
    delta: string;
    isBalanced: boolean;
  };
  pending: AdminBalanceSummaryItem['pending'];
  postedToday: number;
  unbalancedTransactions: number;
};

type TreasuryGroupRow = TreasuryCurrencySection['groupRows'][number];

function buildTreasuryCurrencySections(
  balances: AdminBalanceSummaryItem[],
  ledgerSummary: AdminLedgerListResponse['summary'] | null,
): TreasuryCurrencySection[] {
  const balanceMap = new Map(balances.map((item) => [item.currency, item]));
  const groupMap = new Map<string, TreasuryCurrencySection['groupRows']>();
  const accountMap = new Map<string, TreasuryCurrencySection['accountRows']>();
  const healthMap = new Map<
    string,
    {
      counterpartyTotalMinor: bigint;
      creditTotalMinor: bigint;
      debitSideTotalMinor: bigint;
      deltaMinor: bigint;
      isBalanced: boolean;
    }
  >();
  const currencies = new Set<string>(balances.map((item) => item.currency));

  for (const row of ledgerSummary?.accountGroupSummaries ?? []) {
    currencies.add(row.currency);
    const current = groupMap.get(row.currency) ?? [];
    const equationContributionMinor = getEquationContributionMinor(
      row.net.amountMinor,
      getGroupAccountType(row.accountGroup),
    );
    current.push({
      accountCount: row.accountCount,
      accountGroup: row.accountGroup,
      balance: formatLedgerBalance(
        row.net.amountMinor,
        row.currency,
        getGroupAccountType(row.accountGroup),
      ),
      equationContributionMinor,
      equationEffect: formatSignedMoney(equationContributionMinor, row.currency),
      credits: row.credits,
      debits: row.debits,
      description: row.description,
    });
    groupMap.set(row.currency, current);
  }

  for (const row of ledgerSummary?.trialBalanceRows ?? []) {
    currencies.add(row.currency);
    const current = accountMap.get(row.currency) ?? [];
    const equationContributionMinor = getEquationContributionMinor(
      row.net.amountMinor,
      row.accountType,
    );
    current.push({
      accountCode: row.accountCode,
      accountGroup: row.accountGroup,
      accountType: row.accountType,
      balance: formatLedgerBalance(row.net.amountMinor, row.currency, row.accountType),
      equationContributionMinor,
      equationEffect: formatSignedMoney(equationContributionMinor, row.currency),
      credits: row.credits,
      debits: row.debits,
      displayName: getLedgerAccountDisplayName(row.accountCode, row.accountName),
      referenceLabel: getLedgerAccountReferenceLabel(row.accountCode),
    });
    accountMap.set(row.currency, current);

    const normalSide = getNormalBalanceSide(row.accountType);
    const currentHealth = healthMap.get(row.currency) ?? {
      counterpartyTotalMinor: 0n,
      creditTotalMinor: 0n,
      debitSideTotalMinor: 0n,
      deltaMinor: 0n,
      isBalanced: true,
    };

    if (normalSide === 'debit') {
      currentHealth.debitSideTotalMinor += equationContributionMinor;
    } else {
      currentHealth.counterpartyTotalMinor += equationContributionMinor;
    }

    healthMap.set(row.currency, currentHealth);
  }

  for (const row of ledgerSummary?.currencySummaries ?? []) {
    currencies.add(row.currency);
    const currentHealth = healthMap.get(row.currency) ?? {
      counterpartyTotalMinor: 0n,
      creditTotalMinor: 0n,
      debitSideTotalMinor: 0n,
      deltaMinor: 0n,
      isBalanced: true,
    };

    currentHealth.creditTotalMinor = BigInt(row.credits.amountMinor);
    currentHealth.deltaMinor = BigInt(row.delta.amountMinor);
    currentHealth.isBalanced = currentHealth.deltaMinor === 0n;
    healthMap.set(row.currency, currentHealth);
  }

  return [...currencies]
    .sort((left, right) => left.localeCompare(right))
    .map((currency) => {
      const balance = balanceMap.get(currency);
      const health = healthMap.get(currency) ?? {
        counterpartyTotalMinor: 0n,
        creditTotalMinor: 0n,
        debitSideTotalMinor: 0n,
        deltaMinor: 0n,
        isBalanced: true,
      };

      return {
        accountRows: (accountMap.get(currency) ?? []).sort((left, right) =>
          `${left.accountGroup}:${left.displayName}:${left.accountCode}`.localeCompare(
            `${right.accountGroup}:${right.displayName}:${right.accountCode}`,
          ),
        ),
        activeWalletCount: balance?.activeWalletCount ?? 0,
        available: balance?.available ?? {
          amountMinor: '0',
          currency,
        },
        currency,
        groupRows: (groupMap.get(currency) ?? []).sort((left, right) =>
          left.accountGroup.localeCompare(right.accountGroup),
        ),
        health: {
          counterpartyTotal: formatMoneyFromMinor(health.counterpartyTotalMinor, currency),
          credits: formatMoneyFromMinor(health.creditTotalMinor, currency),
          debitSideTotal: formatMoneyFromMinor(health.debitSideTotalMinor, currency),
          delta: formatSignedMoney(health.deltaMinor, currency, { zeroLabel: '$0.00' }),
          isBalanced: health.isBalanced,
        },
        pending: balance?.pending ?? {
          amountMinor: '0',
          currency,
        },
        postedToday: balance?.postedToday ?? 0,
        unbalancedTransactions: ledgerSummary?.unbalancedTransactions ?? 0,
      };
    });
}

function formatLedgerBalance(
  amountMinor: string,
  currency: string,
  accountType: string,
): { formatted: string; side: 'credit' | 'debit' } {
  const value = BigInt(amountMinor);
  const normalSide = getNormalBalanceSide(accountType);
  const normalizedValue = normalSide === 'debit' ? value : -value;
  const side: 'credit' | 'debit' =
    normalizedValue >= 0n ? normalSide : oppositeBalanceSide(normalSide);
  const absoluteValue = normalizedValue >= 0n ? normalizedValue : -normalizedValue;

  return {
    formatted: `${formatMoneyFromMinor(absoluteValue, currency)} ${side === 'debit' ? 'Dr' : 'Cr'}`,
    side,
  };
}

function getEquationContributionMinor(amountMinor: string, accountType: string): bigint {
  const value = BigInt(amountMinor);
  return getNormalBalanceSide(accountType) === 'debit' ? value : -value;
}

function getNormalBalanceSide(accountType: string): 'credit' | 'debit' {
  switch (accountType) {
    case 'asset':
    case 'expense':
      return 'debit';
    default:
      return 'credit';
  }
}

function oppositeBalanceSide(side: 'credit' | 'debit'): 'credit' | 'debit' {
  return side === 'debit' ? 'credit' : 'debit';
}

function getGroupAccountType(accountGroup: string): string {
  switch (accountGroup) {
    case 'Platform cash':
      return 'asset';
    case 'Platform revenue':
      return 'revenue';
    case 'Recipient payables':
    case 'Wallet liabilities':
      return 'liability';
    default:
      return 'asset';
  }
}

function getLedgerAccountDisplayName(accountCode: string, fallbackName: string): string {
  if (accountCode.startsWith('platform_cash_')) {
    return 'Platform Cash';
  }

  if (accountCode.startsWith('platform_revenue_')) {
    return 'Platform Revenue';
  }

  if (accountCode.startsWith('wallet_')) {
    return 'Wallet Liability';
  }

  if (accountCode.startsWith('recipient_payable_')) {
    return 'Recipient Payable';
  }

  return fallbackName;
}

function getLedgerAccountReferenceLabel(accountCode: string): string | null {
  if (accountCode.startsWith('wallet_')) {
    const owner = accountCode.replace(/^wallet_/, '').replace(/_[a-z]{3}$/i, '');
    return `wallet ${owner.slice(-4)}`;
  }

  if (accountCode.startsWith('recipient_payable_')) {
    const owner = accountCode.replace(/^recipient_payable_/, '').replace(/_[a-z]{3}$/i, '');
    return `recipient ${owner.slice(-4)}`;
  }

  return null;
}

function formatSignedMoney(
  amountMinor: bigint,
  currency: string,
  options?: { zeroLabel?: string },
): string {
  if (amountMinor === 0n) {
    return options?.zeroLabel ?? formatMoneyFromMinor(0n, currency);
  }

  const sign = amountMinor > 0n ? '+' : '-';
  const absoluteValue = amountMinor > 0n ? amountMinor : -amountMinor;

  return `${sign}${formatMoneyFromMinor(absoluteValue, currency)}`;
}

function getGroupEquationValue(groupRows: TreasuryGroupRow[], accountGroup: string): string {
  return (
    groupRows.find((row) => row.accountGroup === accountGroup)?.equationEffect ??
    formatSignedMoney(0n, inferCurrencyFromGroupRows(groupRows), { zeroLabel: '$0.00' })
  );
}

function inferCurrencyFromGroupRows(groupRows: TreasuryGroupRow[]): string {
  return groupRows[0]?.credits.currency ?? 'USD';
}

function HighlightCard({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-[#fcfaf6] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function EquationCard({
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

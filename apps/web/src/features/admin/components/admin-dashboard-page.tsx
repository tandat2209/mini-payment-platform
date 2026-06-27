import {
  AlertTriangle,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  ReceiptText,
  Users,
  Webhook,
} from 'lucide-react';
import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';

export function AdminDashboardPage({
  onNavigate,
}: {
  onNavigate: (path: string) => void;
}): JSX.Element {
  const sections = [
    {
      description: 'Monitor aggregate currency exposure and treasury position.',
      icon: Landmark,
      label: 'Treasury',
      path: '/admin/treasury',
    },
    {
      description: 'Inspect accounting postings and journal integrity.',
      icon: ReceiptText,
      label: 'Ledger',
      path: '/admin/ledger',
    },
    {
      description: 'Review customer wallets, balances, and funding context.',
      icon: Users,
      label: 'Customers',
      path: '/admin/customers',
    },
    {
      description: 'Investigate user-facing funding and payout records.',
      icon: CreditCard,
      label: 'Transactions',
      path: '/admin/transactions',
    },
    {
      description: 'Track payout lifecycle, provider attempts, and outcomes.',
      icon: ArrowLeftRight,
      label: 'Payouts',
      path: '/admin/payouts',
    },
    {
      description: 'Investigate inbound provider events and unresolved exceptions.',
      icon: Webhook,
      label: 'Webhooks',
      path: '/admin/webhooks',
    },
  ];

  return (
    <AdminPageShell
      description="Use the operations console to move from customer activity to ledger impact, provider evidence, and treasury monitoring without leaving the admin workspace."
      eyebrow="Operations"
      metrics={[
        { icon: CreditCard, label: 'Core surfaces', value: 'Treasury, ledger, payouts' },
        { icon: Users, label: 'Customer ops', value: 'Customers and transactions' },
        { icon: AlertTriangle, label: 'Exception path', value: 'Webhooks and reconciliation' },
      ]}
      title="Admin dashboard"
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map(({ description, icon: Icon, label, path }) => (
          <button className="text-left" key={label} onClick={() => onNavigate(path)} type="button">
            <Card className="rounded-[28px] border border-slate-200 bg-white/95 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2557ff] text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </AdminPageShell>
  );
}

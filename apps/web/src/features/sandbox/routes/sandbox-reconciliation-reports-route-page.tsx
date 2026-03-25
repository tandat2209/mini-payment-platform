import { ReceiptText, Rows3, ShieldCheck } from 'lucide-react';
import type { JSX } from 'react';

import { SandboxPlaceholderPage } from '@/features/sandbox/components/sandbox-placeholder-page';

export function SandboxReconciliationReportsRoutePage(): JSX.Element {
  return (
    <SandboxPlaceholderPage
      cards={[
        {
          icon: ReceiptText,
          text: 'Simulate daily report intake for settled activity, returns, and provider-side adjustments.',
          title: 'Report payload',
        },
        {
          icon: Rows3,
          text: 'Map each report line into reconciliation matches, breaks, and operator follow-up paths.',
          title: 'Line matching',
        },
        {
          icon: ShieldCheck,
          text: 'Confirm ledger, webhook, and provider evidence all agree before a report closes cleanly.',
          title: 'Reconciliation status',
        },
      ]}
      description="This placeholder page is for daily reconciliation reports and report-style provider webhooks. It gives us a dedicated home for end-of-day matching and exception review."
      eyebrow="PSP sandbox"
      metrics={[
        { icon: ReceiptText, label: 'Cadence', value: 'Daily report intake' },
        { icon: Rows3, label: 'Granularity', value: 'Line-by-line matching' },
        { icon: ShieldCheck, label: 'Outcome', value: 'Reconciled or exception' },
      ]}
      title="Reconciliation reports"
    />
  );
}

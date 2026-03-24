import { ArrowLeftRight, CheckCheck, Radar } from 'lucide-react';
import type { JSX } from 'react';

import { SandboxPlaceholderPage } from './sandbox-placeholder-page';

export function SandboxPayoutUpdatesRoutePage(): JSX.Element {
  return (
    <SandboxPlaceholderPage
      cards={[
        {
          icon: CheckCheck,
          text: 'Capture provider acknowledgements and accepted callbacks before a payout is final.',
          title: 'Acknowledgements',
        },
        {
          icon: Radar,
          text: 'Model in-flight status changes like processing, failed, returned, or completed.',
          title: 'Status updates',
        },
        {
          icon: ArrowLeftRight,
          text: 'Add final settlement events later when we want cash movement and payable clearing flows.',
          title: 'Settlement step',
        },
      ]}
      description="This placeholder page is for payout acknowledgements and status callbacks. “Payout updates” is the broad term here; settlement is only one later final event in that lifecycle."
      eyebrow="Sandbox tool"
      metrics={[
        { icon: CheckCheck, label: 'Scope', value: 'Acks + statuses' },
        { icon: Radar, label: 'Future flow', value: 'Settlement and failures' },
        { icon: ArrowLeftRight, label: 'Target', value: 'Payout lifecycle simulation' },
      ]}
      title="Payout updates"
    />
  );
}

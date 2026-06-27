import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import type { WalletFundingDetail } from '@/features/customer/api';
import {
  formatDate,
  formatFundingDetailFieldLabel,
  formatFundingDetailFieldValue,
} from '@/features/customer/lib/utils';

export function FundingDetailCard({
  fundingDetail,
}: {
  fundingDetail: WalletFundingDetail;
}): JSX.Element {
  const detailEntries = Object.entries(fundingDetail.details);

  return (
    <div className="rounded-[24px] border border-[#dfe5ff] bg-white p-4 shadow-[0_12px_30px_rgba(37,87,255,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
            {formatFundingDetailFieldLabel(fundingDetail.rail)}
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {fundingDetail.currency} funding instructions
          </p>
          <p className="mt-1 text-sm text-[#9aa6ca]">
            Use these account details to receive inbound funds into this wallet.
          </p>
        </div>
        <Badge tone="default">{fundingDetail.currency}</Badge>
      </div>

      {fundingDetail.updatedAt ? (
        <p className="mt-3 text-xs text-[#a6b0d2]">
          Updated{' '}
          {formatDate(fundingDetail.updatedAt, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      ) : null}

      {detailEntries.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {detailEntries.map(([key, value]) => (
            <div className="rounded-2xl border border-[#dfe5ff] bg-[#f7f9ff] px-3 py-2.5" key={key}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
                {formatFundingDetailFieldLabel(key)}
              </p>
              <p className="mt-1 font-mono text-sm text-slate-900">
                {formatFundingDetailFieldValue(value)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#9aa6ca]">No structured funding details available yet.</p>
      )}
    </div>
  );
}

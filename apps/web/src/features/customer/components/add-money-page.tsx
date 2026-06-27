import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import type { JSX } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { WalletFundingDetailsResponse } from '@/features/customer/api';
import { toTitleCase } from '@/features/customer/lib/utils';

import { FundingDetailCard } from './funding-detail-card';
import { EmptyState, LoadingBlock } from './shared';

export function AddMoneyPage({
  fundingDetailsQuery,
  onBack,
}: {
  fundingDetailsQuery: UseQueryResult<WalletFundingDetailsResponse, Error>;
  onBack: () => void;
}): JSX.Element {
  const fundingDetails = fundingDetailsQuery.data?.fundingDetails ?? [];

  return (
    <section className="space-y-4" id="section-add-money">
      <Card className="rounded-[26px] border border-[#dfe5ff] bg-white shadow-[0_18px_50px_rgba(37,87,255,0.07)]">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button className="rounded-xl px-3.5" onClick={onBack} variant="ghost">
              <ArrowLeft className="h-4 w-4" />
              Back to overview
            </Button>
            {fundingDetailsQuery.data?.wallet ? (
              <Badge tone="default">{toTitleCase(fundingDetailsQuery.data.wallet.status)}</Badge>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_320px] lg:items-start">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
                Add money
              </p>
              <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Funding details
              </h1>
              <p className="max-w-xl text-sm text-[#9aa6ca]">
                Use these details to receive funds into this wallet.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#dfe5ff] bg-[#f7f9ff] p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#a6b0d2]">
                Wallet
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                {fundingDetailsQuery.data?.wallet.id ?? 'Loading wallet'}
              </p>
              <p className="mt-1 text-sm text-[#9aa6ca]">
                Active funding instructions for the current customer account.
              </p>
            </div>
          </div>

          {fundingDetailsQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <LoadingBlock className="h-56" />
              <LoadingBlock className="h-56" />
            </div>
          ) : null}

          {fundingDetailsQuery.isError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {fundingDetailsQuery.error instanceof Error
                ? fundingDetailsQuery.error.message
                : 'Funding details unavailable'}
            </div>
          ) : null}

          {!fundingDetailsQuery.isLoading &&
          !fundingDetailsQuery.isError &&
          fundingDetails.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {fundingDetails.map((fundingDetail) => (
                <FundingDetailCard fundingDetail={fundingDetail} key={fundingDetail.id} />
              ))}
            </div>
          ) : null}

          {!fundingDetailsQuery.isLoading &&
          !fundingDetailsQuery.isError &&
          fundingDetails.length === 0 ? (
            <EmptyState
              message="This wallet does not have any active funding instructions yet."
              title="No funding details available"
            />
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

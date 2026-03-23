import { Plus } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const recipientPreviewRows = [
  {
    lastUsed: 'Today',
    name: 'Vendor One LLC',
    rail: 'Local account',
    status: 'Verified',
  },
  {
    lastUsed: 'Mar 22',
    name: 'Acme Europe GmbH',
    rail: 'IBAN',
    status: 'Verified',
  },
  {
    lastUsed: 'Mar 18',
    name: 'Northwind Services',
    rail: 'Virtual account',
    status: 'Pending refresh',
  },
];

export function CustomerRecipientsPage(): JSX.Element {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
      <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fffdf9] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Recipients
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Beneficiary directory
              </h1>
            </div>
            <Button className="rounded-xl px-4" variant="outline">
              <Plus className="h-4 w-4" />
              Add recipient
            </Button>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="grid grid-cols-[minmax(0,1.4fr)_140px_140px_120px] gap-3 border-b border-slate-200 bg-[#faf7f2] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              <span>Recipient</span>
              <span>Rail</span>
              <span>Status</span>
              <span>Last used</span>
            </div>
            <div className="divide-y divide-slate-200/70">
              {recipientPreviewRows.map((recipient) => (
                <div
                  className="grid grid-cols-[minmax(0,1.4fr)_140px_140px_120px] gap-3 px-4 py-3"
                  key={recipient.name}
                >
                  <div>
                    <p className="font-medium text-slate-950">{recipient.name}</p>
                    <p className="text-sm text-slate-500">
                      Ready for payout and reconciliation review
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">{recipient.rail}</p>
                  <p className="text-sm font-medium text-slate-700">{recipient.status}</p>
                  <p className="text-sm text-slate-500">{recipient.lastUsed}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border border-[#e7e1d8] bg-[#fcfaf6] shadow-[0_10px_40px_rgba(15,23,42,0.03)]">
        <CardContent className="space-y-4 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Recipient notes
          </p>
          <div className="rounded-[24px] border border-white bg-white p-4">
            <p className="text-base font-semibold text-slate-950">Separation of concerns</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Recipients stay in their own page so customer operators can manage destination details
              without mixing that work into wallet overview or funding instructions.
            </p>
          </div>
          <div className="rounded-[24px] border border-white bg-white p-4">
            <p className="text-base font-semibold text-slate-950">Future-ready layout</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              When the recipient API lands, this route can grow into a searchable registry without
              another shell or navigation rework.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

import { Bell, Search, Shield } from 'lucide-react';
import type { JSX } from 'react';

import { Input } from '@/components/ui/input';

export function AdminTopbar(): JSX.Element {
  return (
    <div className="mb-5 rounded-[28px] border border-[#dfe5ff] bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(37,87,255,0.06)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2557ff] text-white xl:flex">
            <Shield className="h-5 w-5" />
          </div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search admin"
              className="pl-9"
              placeholder="Search transactions, payouts, webhooks, customers, or references"
              type="search"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 xl:justify-end">
          <button
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#dfe5ff] bg-[#f7f9ff] px-3 text-sm font-medium text-[#657196] transition-colors hover:bg-[#eef2ff] hover:text-[#173184]"
            type="button"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-[#dfe5ff] bg-[#f7f9ff] px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2557ff] text-sm font-semibold text-white">
              OP
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">Operations</p>
              <p className="truncate text-xs text-slate-500">Admin operator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

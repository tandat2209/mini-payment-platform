import { Clock3 } from 'lucide-react';
import type { JSX } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { AdminPageShell } from '@/features/admin/components/admin-page-shell';

export function AdminPlaceholderPage({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}): JSX.Element {
  return (
    <AdminPageShell description={description} eyebrow={eyebrow} title={title}>
      <Card className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
        <CardContent className="flex flex-col items-start gap-3 p-5 text-sm text-slate-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Workspace reserved</p>
            <p className="mt-1 max-w-2xl leading-6">
              This section is part of the new admin console structure and is ready for detailed
              implementation in a follow-up slice.
            </p>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

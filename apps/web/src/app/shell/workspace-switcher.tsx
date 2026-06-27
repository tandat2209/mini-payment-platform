import type { JSX } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { type Workspace, workspaceItems } from './navigation-config';

export function WorkspaceSwitcher({
  activeWorkspace,
  onWorkspaceSelect,
  variant = 'floating',
}: {
  activeWorkspace: Workspace;
  onWorkspaceSelect: (workspace: Workspace) => void;
  variant?: 'floating' | 'sidebar';
}): JSX.Element {
  const isSidebar = variant === 'sidebar';

  return (
    <div className={cn(isSidebar ? 'mt-4' : 'fixed bottom-4 left-4 z-40 lg:hidden')}>
      <div
        className={cn(
          'rounded-[22px] border border-[#dfe5ff] bg-white/95 p-2 backdrop-blur-xl',
          isSidebar ? 'shadow-none' : 'shadow-[0_18px_45px_rgba(15,23,42,0.14)]',
        )}
      >
        <Select
          onValueChange={(value) => onWorkspaceSelect(value as Workspace)}
          value={activeWorkspace}
        >
          <SelectTrigger
            aria-label="Switch workspace"
            className={cn(
              'border-[#dfe5ff] bg-white shadow-none',
              isSidebar ? 'w-full' : 'min-w-[220px]',
            )}
          >
            <SelectValue aria-label="Workspace" />
          </SelectTrigger>
          <SelectContent align="start" className="min-w-[220px]">
            {workspaceItems.map((workspace) => {
              const Icon = workspace.icon;

              return (
                <SelectItem key={workspace.id} value={workspace.id}>
                  <span className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#2557ff]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{workspace.label}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {!isSidebar ? (
          <p className="mt-2 px-1 text-[11px] font-medium text-slate-500">Workspace</p>
        ) : null}
      </div>
    </div>
  );
}

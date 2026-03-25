import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Boxes,
  CreditCard,
  FlaskConical,
  LayoutGrid,
  Radar,
  ReceiptText,
  Shield,
  Wallet,
} from 'lucide-react';

export type Workspace = 'admin' | 'customer' | 'sandbox';
export type CustomerPageId = 'funding-details' | 'overview' | 'payout' | 'recipients';
export type AdminPageId = 'balances' | 'ledgers' | 'transactions' | 'wallet';
export type SandboxPageId = 'funding' | 'payout-updates' | 'reconciliation-reports';
export type NavigationId = AdminPageId | CustomerPageId | SandboxPageId;

export type NavigationItem = {
  icon: LucideIcon;
  id: NavigationId;
  label: string;
  path: string;
};

export const customerNavigationItems: NavigationItem[] = [
  { icon: LayoutGrid, id: 'overview', label: 'Overview', path: '/' },
  { icon: ArrowLeftRight, id: 'payout', label: 'Payout', path: '/payout' },
  { icon: CreditCard, id: 'recipients', label: 'Recipients', path: '/recipients' },
  { icon: Wallet, id: 'funding-details', label: 'Funding details', path: '/funding-details' },
];

export const adminNavigationItems: NavigationItem[] = [
  { icon: Wallet, id: 'wallet', label: 'Wallet', path: '/admin' },
  { icon: Boxes, id: 'balances', label: 'Balances', path: '/admin/balances' },
  { icon: CreditCard, id: 'transactions', label: 'Transactions', path: '/admin/transactions' },
  { icon: ReceiptText, id: 'ledgers', label: 'Ledgers', path: '/admin/ledgers' },
];

export const sandboxNavigationItems: NavigationItem[] = [
  { icon: FlaskConical, id: 'funding', label: 'Funding', path: '/sandbox/funding' },
  { icon: Radar, id: 'payout-updates', label: 'Payout updates', path: '/sandbox/payout-updates' },
  {
    icon: ReceiptText,
    id: 'reconciliation-reports',
    label: 'Reconciliation reports',
    path: '/sandbox/reconciliation-reports',
  },
];

export const workspaceItems: Array<{
  defaultPath: string;
  icon: LucideIcon;
  id: Workspace;
  label: string;
}> = [
  {
    defaultPath: '/',
    icon: LayoutGrid,
    id: 'customer',
    label: 'Customer',
  },
  {
    defaultPath: '/admin',
    icon: Shield,
    id: 'admin',
    label: 'Admin',
  },
  {
    defaultPath: '/sandbox/funding',
    icon: FlaskConical,
    id: 'sandbox',
    label: 'PSP Sandbox',
  },
];

export function getWorkspaceFromPath(pathname: string): Workspace {
  if (pathname.startsWith('/sandbox')) {
    return 'sandbox';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  return 'customer';
}

export function getWorkspaceNavigationItems(workspace: Workspace): NavigationItem[] {
  switch (workspace) {
    case 'admin':
      return adminNavigationItems;
    case 'sandbox':
      return sandboxNavigationItems;
    default:
      return customerNavigationItems;
  }
}

export function getWorkspaceHeadline(workspace: Workspace): {
  navLabel: string;
  title: string;
} {
  switch (workspace) {
    case 'admin':
      return {
        navLabel: 'Admin navigation',
        title: 'Admin',
      };
    case 'sandbox':
      return {
        navLabel: 'Sandbox tools',
        title: 'PSP Sandbox',
      };
    default:
      return {
        navLabel: 'Customer navigation',
        title: 'Customer',
      };
  }
}

export function getActiveNavigationId(pathname: string): NavigationId {
  switch (pathname) {
    case '/':
      return 'overview';
    case '/payout':
      return 'payout';
    case '/recipients':
      return 'recipients';
    case '/funding-details':
      return 'funding-details';
    case '/admin':
      return 'wallet';
    case '/admin/balances':
      return 'balances';
    case '/admin/transactions':
      return 'transactions';
    case '/admin/ledgers':
      return 'ledgers';
    case '/sandbox/funding':
      return 'funding';
    case '/sandbox/payout-updates':
      return 'payout-updates';
    case '/sandbox/reconciliation-reports':
      return 'reconciliation-reports';
    default:
      if (pathname.startsWith('/sandbox/reconciliation-reports')) {
        return 'reconciliation-reports';
      }

      if (pathname.startsWith('/sandbox/payout-updates')) {
        return 'payout-updates';
      }

      if (pathname.startsWith('/sandbox')) {
        return 'funding';
      }

      return pathname.startsWith('/admin') ? 'wallet' : 'overview';
  }
}

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeftRight,
  CreditCard,
  FileBarChart2,
  FlaskConical,
  Landmark,
  LayoutGrid,
  ListChecks,
  Radar,
  ReceiptText,
  Settings,
  Shield,
  Users,
  Wallet,
  Webhook,
} from 'lucide-react';

export type Workspace = 'admin' | 'customer' | 'sandbox';
export type CustomerPageId = 'funding-details' | 'overview' | 'payout' | 'recipients';
export type AdminPageId =
  | 'audit-logs'
  | 'customers'
  | 'dashboard'
  | 'ledger'
  | 'payouts'
  | 'reconciliation'
  | 'reports'
  | 'settings'
  | 'transactions'
  | 'treasury'
  | 'webhooks';
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
  { icon: LayoutGrid, id: 'dashboard', label: 'Dashboard', path: '/admin' },
  { icon: Landmark, id: 'treasury', label: 'Treasury', path: '/admin/treasury' },
  { icon: ReceiptText, id: 'ledger', label: 'Ledger', path: '/admin/ledger' },
  { icon: Users, id: 'customers', label: 'Customers', path: '/admin/customers' },
  { icon: CreditCard, id: 'transactions', label: 'Transactions', path: '/admin/transactions' },
  { icon: ArrowLeftRight, id: 'payouts', label: 'Payouts', path: '/admin/payouts' },
  {
    icon: AlertTriangle,
    id: 'reconciliation',
    label: 'Reconciliation',
    path: '/admin/reconciliation',
  },
  { icon: Webhook, id: 'webhooks', label: 'Webhooks', path: '/admin/webhooks' },
  { icon: FileBarChart2, id: 'reports', label: 'Reports', path: '/admin/reports' },
  { icon: ListChecks, id: 'audit-logs', label: 'Audit logs', path: '/admin/audit-logs' },
  { icon: Settings, id: 'settings', label: 'Settings', path: '/admin/settings' },
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
        title: 'Operations',
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
    case '/admin/dashboard':
      return 'dashboard';
    case '/admin/customers':
      return 'customers';
    case '/admin/treasury':
      return 'treasury';
    case '/admin/transactions':
      return 'transactions';
    case '/admin/ledger':
      return 'ledger';
    case '/admin/payouts':
      return 'payouts';
    case '/admin/recipients':
      return 'payouts';
    case '/admin/reconciliation':
      return 'reconciliation';
    case '/admin/webhooks':
      return 'webhooks';
    case '/admin/reports':
      return 'reports';
    case '/admin/audit-logs':
      return 'audit-logs';
    case '/admin/settings':
      return 'settings';
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

      if (pathname.startsWith('/admin/transactions')) {
        return 'transactions';
      }
      if (pathname.startsWith('/admin/ledger')) {
        return 'ledger';
      }
      if (pathname.startsWith('/admin/payouts')) {
        return 'payouts';
      }
      if (pathname.startsWith('/admin/recipients')) {
        return 'payouts';
      }
      if (pathname.startsWith('/admin/customers')) {
        return 'customers';
      }
      if (pathname.startsWith('/admin/treasury')) {
        return 'treasury';
      }
      if (pathname.startsWith('/admin/reconciliation')) {
        return 'reconciliation';
      }
      if (pathname.startsWith('/admin/webhooks')) {
        return 'webhooks';
      }
      if (pathname.startsWith('/admin/reports')) {
        return 'reports';
      }
      if (pathname.startsWith('/admin/audit-logs')) {
        return 'audit-logs';
      }
      if (pathname.startsWith('/admin/settings')) {
        return 'settings';
      }

      return pathname.startsWith('/admin') ? 'dashboard' : 'overview';
  }
}

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Boxes,
  CreditCard,
  LayoutGrid,
  ReceiptText,
  Shield,
  Wallet,
} from 'lucide-react';

export type Workspace = 'customer' | 'admin';
export type CustomerPageId = 'overview' | 'payout' | 'recipients' | 'funding-details';
export type AdminPageId = 'wallet' | 'balances' | 'simulator' | 'transactions' | 'ledgers';
export type NavigationId = CustomerPageId | AdminPageId;

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

export const adminSandboxNavigationItems: NavigationItem[] = [
  { icon: Shield, id: 'simulator', label: 'Simulator', path: '/admin/simulator' },
];

export const workspaceItems: Array<{
  defaultPath: string;
  description: string;
  icon: LucideIcon;
  id: Workspace;
  label: string;
}> = [
  {
    defaultPath: '/',
    description: 'Customer dashboard, payouts, recipients, and funding details',
    icon: LayoutGrid,
    id: 'customer',
    label: 'Customer',
  },
  {
    defaultPath: '/admin',
    description: 'Admin console for simulator, transactions, wallets, balances, and ledgers',
    icon: Shield,
    id: 'admin',
    label: 'Admin',
  },
];

export function getWorkspaceFromPath(pathname: string): Workspace {
  return pathname.startsWith('/admin') ? 'admin' : 'customer';
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
    case '/admin/simulator':
      return 'simulator';
    case '/admin/transactions':
      return 'transactions';
    case '/admin/ledgers':
      return 'ledgers';
    default:
      return pathname.startsWith('/admin') ? 'wallet' : 'overview';
  }
}

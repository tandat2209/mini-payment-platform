import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import App from './App';
import { AdminBalancesRoutePage } from './components/admin/admin-balances-route-page';
import { AdminLedgersRoutePage } from './components/admin/admin-ledgers-route-page';
import { AdminTransactionsRoutePage } from './components/admin/admin-transactions-route-page';
import { AdminWalletRoutePage } from './components/admin/admin-wallet-route-page';
import { AddMoneyRoutePage } from './components/dashboard/add-money-route-page';
import { CustomerPayoutRoutePage } from './components/dashboard/customer-payout-route-page';
import { CustomerRecipientsRoutePage } from './components/dashboard/customer-recipients-route-page';
import { DashboardRoutePage } from './components/dashboard/dashboard-route-page';
import { SandboxFundingRoutePage } from './components/sandbox/sandbox-funding-route-page';
import { SandboxPayoutUpdatesRoutePage } from './components/sandbox/sandbox-payout-updates-route-page';
import { SandboxReconciliationReportsRoutePage } from './components/sandbox/sandbox-reconciliation-reports-route-page';

const rootRoute = createRootRoute({
  component: App,
});

const overviewRoute = createRoute({
  component: DashboardRoutePage,
  getParentRoute: () => rootRoute,
  path: '/',
});

const payoutRoute = createRoute({
  component: CustomerPayoutRoutePage,
  getParentRoute: () => rootRoute,
  path: '/payout',
});

const recipientsRoute = createRoute({
  component: CustomerRecipientsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/recipients',
});

const fundingDetailsRoute = createRoute({
  component: AddMoneyRoutePage,
  getParentRoute: () => rootRoute,
  path: '/funding-details',
});

const adminWalletRoute = createRoute({
  component: AdminWalletRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin',
});

const adminBalancesRoute = createRoute({
  component: AdminBalancesRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/balances',
});

const adminTransactionsRoute = createRoute({
  component: AdminTransactionsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/transactions',
  validateSearch: (search: Record<string, unknown>) => ({
    transactionId: typeof search.transactionId === 'string' ? search.transactionId : undefined,
  }),
});

const adminLedgersRoute = createRoute({
  component: AdminLedgersRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/ledgers',
  validateSearch: (search: Record<string, unknown>) => ({
    ledgerTransactionId:
      typeof search.ledgerTransactionId === 'string' ? search.ledgerTransactionId : undefined,
  }),
});

const sandboxFundingRoute = createRoute({
  component: SandboxFundingRoutePage,
  getParentRoute: () => rootRoute,
  path: '/sandbox/funding',
});

const sandboxPayoutUpdatesRoute = createRoute({
  component: SandboxPayoutUpdatesRoutePage,
  getParentRoute: () => rootRoute,
  path: '/sandbox/payout-updates',
});

const sandboxReconciliationReportsRoute = createRoute({
  component: SandboxReconciliationReportsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/sandbox/reconciliation-reports',
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  payoutRoute,
  recipientsRoute,
  fundingDetailsRoute,
  adminWalletRoute,
  adminBalancesRoute,
  adminTransactionsRoute,
  adminLedgersRoute,
  sandboxFundingRoute,
  sandboxPayoutUpdatesRoute,
  sandboxReconciliationReportsRoute,
]);

export const router = createRouter({
  routeTree,
});

export { adminLedgersRoute, adminTransactionsRoute };

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

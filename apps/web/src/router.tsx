import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import App from './App';
import { AdminBalancesRoutePage } from './components/admin/admin-balances-route-page';
import { AdminLedgersRoutePage } from './components/admin/admin-ledgers-route-page';
import { AdminSimulatorRoutePage } from './components/admin/admin-simulator-route-page';
import { AdminTransactionsRoutePage } from './components/admin/admin-transactions-route-page';
import { AdminWalletRoutePage } from './components/admin/admin-wallet-route-page';
import { AddMoneyRoutePage } from './components/dashboard/add-money-route-page';
import { CustomerPayoutRoutePage } from './components/dashboard/customer-payout-route-page';
import { CustomerRecipientsRoutePage } from './components/dashboard/customer-recipients-route-page';
import { DashboardRoutePage } from './components/dashboard/dashboard-route-page';

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

const adminSimulatorRoute = createRoute({
  component: AdminSimulatorRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/simulator',
});

const adminTransactionsRoute = createRoute({
  component: AdminTransactionsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/transactions',
});

const adminLedgersRoute = createRoute({
  component: AdminLedgersRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/ledgers',
});

const routeTree = rootRoute.addChildren([
  overviewRoute,
  payoutRoute,
  recipientsRoute,
  fundingDetailsRoute,
  adminWalletRoute,
  adminBalancesRoute,
  adminSimulatorRoute,
  adminTransactionsRoute,
  adminLedgersRoute,
]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

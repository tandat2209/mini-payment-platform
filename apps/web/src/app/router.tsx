import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import App from '@/app/app-root';
import { AdminAuditLogsRoutePage } from '@/features/admin/routes/admin-audit-logs-route-page';
import { AdminBalancesRoutePage } from '@/features/admin/routes/admin-balances-route-page';
import { AdminDashboardRoutePage } from '@/features/admin/routes/admin-dashboard-route-page';
import { AdminLedgersRoutePage } from '@/features/admin/routes/admin-ledgers-route-page';
import { AdminPayoutsRoutePage } from '@/features/admin/routes/admin-payouts-route-page';
import { AdminRecipientsRoutePage } from '@/features/admin/routes/admin-recipients-route-page';
import { AdminReconciliationRoutePage } from '@/features/admin/routes/admin-reconciliation-route-page';
import { AdminReportsRoutePage } from '@/features/admin/routes/admin-reports-route-page';
import { AdminSettingsRoutePage } from '@/features/admin/routes/admin-settings-route-page';
import { AdminTransactionsRoutePage } from '@/features/admin/routes/admin-transactions-route-page';
import { AdminWalletRoutePage } from '@/features/admin/routes/admin-wallet-route-page';
import { AdminWebhooksRoutePage } from '@/features/admin/routes/admin-webhooks-route-page';
import { AddMoneyRoutePage } from '@/features/customer/routes/add-money-route-page';
import { CustomerPayoutRoutePage } from '@/features/customer/routes/customer-payout-route-page';
import { CustomerRecipientsRoutePage } from '@/features/customer/routes/customer-recipients-route-page';
import { DashboardRoutePage } from '@/features/customer/routes/dashboard-route-page';
import { SandboxFundingRoutePage } from '@/features/sandbox/routes/sandbox-funding-route-page';
import { SandboxPayoutUpdatesRoutePage } from '@/features/sandbox/routes/sandbox-payout-updates-route-page';
import { SandboxReconciliationReportsRoutePage } from '@/features/sandbox/routes/sandbox-reconciliation-reports-route-page';

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
  component: AdminDashboardRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin',
});

const adminBalancesRoute = createRoute({
  component: AdminBalancesRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/treasury',
});

const adminCustomersRoute = createRoute({
  component: AdminWalletRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/customers',
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === 'string' ? search.query : undefined,
  }),
});

const adminTransactionsRoute = createRoute({
  component: AdminTransactionsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/transactions',
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === 'string' ? search.query : undefined,
    transactionId: typeof search.transactionId === 'string' ? search.transactionId : undefined,
    type:
      search.type === 'all' || search.type === 'funding' || search.type === 'payout'
        ? search.type
        : undefined,
  }),
});

const adminLedgersRoute = createRoute({
  component: AdminLedgersRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/ledger',
  validateSearch: (search: Record<string, unknown>) => ({
    currency: typeof search.currency === 'string' ? search.currency : undefined,
    ledgerTransactionId:
      typeof search.ledgerTransactionId === 'string' ? search.ledgerTransactionId : undefined,
  }),
});

const adminPayoutsRoute = createRoute({
  component: AdminPayoutsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/payouts',
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === 'string' ? search.query : undefined,
  }),
});

const adminRecipientsRoute = createRoute({
  component: AdminRecipientsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/recipients',
});

const adminReconciliationRoute = createRoute({
  component: AdminReconciliationRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/reconciliation',
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === 'string' ? search.query : undefined,
  }),
});

const adminWebhooksRoute = createRoute({
  component: AdminWebhooksRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/webhooks',
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === 'string' ? search.query : undefined,
  }),
});

const adminReportsRoute = createRoute({
  component: AdminReportsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/reports',
});

const adminAuditLogsRoute = createRoute({
  component: AdminAuditLogsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/audit-logs',
});

const adminSettingsRoute = createRoute({
  component: AdminSettingsRoutePage,
  getParentRoute: () => rootRoute,
  path: '/admin/settings',
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
  adminCustomersRoute,
  adminTransactionsRoute,
  adminLedgersRoute,
  adminPayoutsRoute,
  adminRecipientsRoute,
  adminReconciliationRoute,
  adminWebhooksRoute,
  adminReportsRoute,
  adminAuditLogsRoute,
  adminSettingsRoute,
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

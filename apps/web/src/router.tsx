import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import App from './App';
import { AddMoneyRoutePage } from './components/dashboard/add-money-route-page';
import { DashboardRoutePage } from './components/dashboard/dashboard-route-page';

const rootRoute = createRootRoute({
  component: App,
});

const dashboardRoute = createRoute({
  component: DashboardRoutePage,
  getParentRoute: () => rootRoute,
  path: '/',
});

const addMoneyRoute = createRoute({
  component: AddMoneyRoutePage,
  getParentRoute: () => rootRoute,
  path: '/add-money',
});

const routeTree = rootRoute.addChildren([dashboardRoute, addMoneyRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

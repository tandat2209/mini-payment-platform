## 1. Dashboard Shell And Visual System

- [x] 1.1 Replace the current placeholder page with a product-style customer dashboard shell in `apps/web`.
- [x] 1.2 Add the primary navigation, topbar context area, and quick-action region with responsive behavior for desktop and mobile.
- [x] 1.3 Establish the new visual system for typography, surfaces, spacing, status pills, and data-card treatments.

## 2. Financial Overview Experience

- [x] 2.1 Implement the overview hero with total balance, wallet context, and wallet status presentation.
- [x] 2.2 Implement KPI-style summary cards and per-currency balance cards using the existing customer balance API.
- [x] 2.3 Add empty, loading, and fallback states for the financial overview so the shell remains stable when balance data is unavailable.

## 3. Activity Workspace

- [x] 3.1 Implement the recent transaction activity section using the existing customer transaction API.
- [x] 3.2 Implement supporting overview panels for recipients and statements using the existing customer recipient and statement APIs.
- [x] 3.3 Ensure transaction, recipient, and statement sections can load and fail independently without breaking the rest of the dashboard.

## 4. Verification

- [x] 4.1 Verify the dashboard layout and responsiveness across desktop and mobile breakpoints.
- [x] 4.2 Verify the UI against local API data and confirm section-level fallback behavior when selected endpoints fail.
- [x] 4.3 Update local docs or verification notes for exercising the real-world dashboard in development.

## Context

The current web app is a single-purpose API connectivity screen. It proves that the frontend can reach the backend, but it does not provide the navigation, information hierarchy, or financial presentation expected from a payment platform product. The repository now has customer-facing read APIs for balances, transactions, statements, and recipients, which means the web app can move beyond a placeholder and become the primary customer workspace for those capabilities.

The implementation needs to stay lightweight enough for a mini project, but the resulting interface should still resemble a production fintech dashboard rather than a marketing page or a mock admin panel. That means using a durable application shell, consistent data cards, clear money presentation, and responsive behavior that supports both desktop and mobile usage.

## Goals / Non-Goals

**Goals:**

- Establish a real-world dashboard shell with sidebar navigation, top bar context, and a main content canvas.
- Present customer financial information in a product-grade layout using the existing read-only API surface.
- Create a reusable visual system for cards, tables, pills, sections, and action bars so future flows can plug into the same structure.
- Preserve graceful local development behavior when one or more API endpoints are unavailable.
- Keep the implementation frontend-only within `apps/web`, without requiring backend contract changes.

**Non-Goals:**

- Building authenticated session flows or full customer identity management.
- Implementing payout creation, recipient editing, or any write-side journey.
- Reproducing Wise or any other product pixel-for-pixel.
- Introducing a heavy component library or design system dependency for this first dashboard iteration.

## Decisions

### Decision: Use a product dashboard shell instead of a single-page marketing-style layout

The web app will use a left navigation rail, a top context bar, and a multi-section content area. This structure mirrors how real payment platforms organize repeat-use workflows and gives balances, transactions, recipients, and statements a stable home.

Alternatives considered:

- Keep a single-page stacked layout: simpler, but it reads like a demo rather than an application.
- Use top navigation only: workable on desktop, but it weakens hierarchy once more payment features arrive.

### Decision: Make the overview page the primary landing surface

The first implemented screen will be an overview dashboard that combines total balance, currency summaries, recent transactions, recipients, and statements in one place. This gives users immediate value and uses the read-only APIs already available.

Alternatives considered:

- Start with a dedicated balances page: strong for one feature, but too narrow for an application home.
- Start with a transactions page: useful, but less representative of a holistic payment platform.

### Decision: Favor a light, premium fintech visual language

The dashboard will use a light neutral foundation, dark text, high-contrast money values, restrained accent colors, and subtle surface layering. This better matches the tone of established payment products and avoids the “template dark mode” look that often makes small projects feel less credible.

Alternatives considered:

- Keep the existing dark glass look: visually pleasant, but closer to a landing card than a working product.
- Use a generic utility-dashboard aesthetic: faster, but less distinctive and less aligned with customer money management products.

### Decision: Build around reusable presentation sections, not a monolithic page

The implementation will split the page into reusable sections such as app shell, hero summary, KPI cards, transaction table, recipient list, and statement card. Even if these begin in a small number of files, the design will treat them as composable presentation blocks.

Alternatives considered:

- Keep everything in one component: fast initially, but hard to evolve once admin and payout flows arrive.

### Decision: Support partial data availability with clear empty and degraded states

The dashboard should still render a credible shell even if some endpoints are unavailable locally. Each section will handle loading, empty, and failure states independently so the whole page does not collapse because one query fails.

Alternatives considered:

- Block the whole dashboard on a single combined request: easier to orchestrate, but fragile during development and less resilient in production.

## Risks / Trade-offs

- [Risk] More UI polish increases implementation scope. → Mitigation: keep the first release to one overview route with well-chosen sections instead of building many pages at once.
- [Risk] Multiple API sections can create a noisy loading experience. → Mitigation: use stable section skeletons and preserve layout height while data loads.
- [Risk] A premium visual direction can drift into decoration over usability. → Mitigation: prioritize data density, readable tables, and clear financial hierarchy over ornamental effects.
- [Risk] Mobile responsiveness can become an afterthought in dashboard work. → Mitigation: design the shell with explicit mobile behavior from the start, including a collapsed navigation pattern and stacked cards.

## Migration Plan

1. Replace the current placeholder page with the new application shell and overview layout.
2. Wire overview sections to the existing read-only API endpoints with section-level loading and error handling.
3. Preserve a lightweight health or connectivity signal inside the dashboard instead of dedicating the entire screen to it.
4. Validate responsive behavior and local developer flows before building any secondary routes.

## Open Questions

- Should the initial customer context be represented as a hard-coded demo customer selector or a static wallet identity label until authentication exists?
- Should statement access stay as a summary card on the overview page only, or should the first implementation also include a dedicated statements route stub for future growth?

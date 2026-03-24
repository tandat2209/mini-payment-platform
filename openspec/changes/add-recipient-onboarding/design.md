## Context

The platform already separates recipients from recipient rail details at the schema level and exposes customer-scoped recipient read APIs, but there is no executable recipient onboarding flow before payout. At the same time, the next payout work depends on answering a structural question now: do we treat recipients as reusable payout destinations, or do we let every payout embed raw beneficiary details inline?

Real provider patterns lean toward reusable beneficiary resources, but not uniformly in the same way. Wise centers payout flows around previously created recipients and later transfer references. Adyen uses verified transfer instruments before funds can move to an external account. Some providers also support passing destination details inline at payout submission. That means the platform should not hard-code one PSP behavior for every rail, but it should still choose one stable internal model for the product and APIs.

This change touches `apps/api`, `apps/web`, and `apps/psp-sandbox`, plus recipient, payout, and provider-integration boundaries.

## Goals / Non-Goals

**Goals:**

- Establish recipient onboarding as a first-class flow before payout.
- Support rail-specific required fields that vary by country, currency, and payout rail.
- Keep one stable internal payout contract that references a saved recipient rail instead of inline payout destination data.
- Support both provider strategies: pre-register beneficiary details when required, or embed details at payout time when the provider allows it.
- Make the PSP sandbox capable of exercising both pre-registration and inline-detail payout strategies later.

**Non-Goals:**

- Implementing the full payout execution flow in this change.
- Designing a production sanctions/KYC engine for beneficiaries.
- Supporting every global payout rail immediately.
- Building file-based reconciliation for recipient onboarding in this change.

## Decisions

### Decision: Always create an internal recipient and recipient rail before payout

The platform will always persist a recipient record and one or more recipient rail records before payout submission. Customer-facing payout flows will reference an internal `recipientRailId`, never raw bank details submitted inline with the payout request.

This gives the product a reusable recipient model, reduces repeated data entry, supports auditability, and keeps payout APIs stable across providers. It also matches how real systems evolve once recipients become reusable objects rather than one-off payout payload fragments.

Alternatives considered:

- Let payouts always embed raw beneficiary details inline: simpler initially, but it weakens auditability, duplicates validation, and makes “saved recipients” a second-class concept.
- Force every payout provider to require pre-created external beneficiaries: too rigid, because some providers and rails can accept destination details inline.

### Decision: Use a hybrid provider strategy for recipient registration

The platform will store a provider registration strategy on each recipient rail:

- `provider_managed`: the rail must or should be registered with the PSP before payout, and the platform stores a provider recipient reference.
- `platform_managed`: the platform stores validated rail details and sends them inline during payout creation when the PSP supports that model.

This is the best compromise between product consistency and provider realism. Internally, the system always has a reusable recipient rail. Externally, the provider integration can choose the right submission strategy per rail and provider.

Alternatives considered:

- Pre-register every rail with the PSP: operationally consistent, but unnecessary for providers that accept inline payout details.
- Never pre-register with the PSP: easier for a toy flow, but incompatible with providers that verify or tokenize beneficiaries before payout.

### Decision: Resolve recipient requirements dynamically from rail, country, and currency

Recipient onboarding will not use one universal bank-detail form. Instead, the API will expose requirement metadata derived from:

- payout rail
- recipient country
- payout currency
- recipient type when relevant later

This supports cases like:

- SWIFT requiring account number plus SWIFT/BIC
- SEPA requiring IBAN
- ACH requiring routing number and account number

It also leaves room for later provider-specific constraints without turning the web form into a hard-coded matrix.

Alternatives considered:

- Hard-code a single field set per rail in the web app: fast now, but brittle once country or currency rules diverge.
- Push all validation into payout submission only: too late in the flow and poor user experience.

### Decision: Separate recipient identity from rail detail activation state

A recipient record will represent the person or business being paid. Each recipient rail will have its own lifecycle, such as:

- `draft`
- `pending_provider_registration`
- `active`
- `failed`
- `archived`

This allows one recipient to have multiple rails at different readiness levels without blocking the entire recipient.

Alternatives considered:

- One status on the recipient only: too coarse when a recipient has multiple rails.
- Treat each rail as a separate recipient: duplicates beneficiary identity and makes the UX worse.

### Decision: Keep sensitive rail data server-side and return masked display data only

Raw recipient account identifiers will be accepted and stored only through server-side APIs. Customer-facing reads will continue to return masked values, while the payout engine and provider integration can access the raw stored details.

This keeps onboarding compatible with later security hardening and aligns with the current masked-recipient read pattern.

Alternatives considered:

- Store only masked data and ask users to re-enter raw details later: breaks payout usability.
- Return raw rail details to the customer UI after creation: unnecessary exposure of sensitive payout data.

### Decision: Use PSP sandbox coverage to model both beneficiary registration and inline payout submission

`apps/psp-sandbox` should later support both:

- explicit beneficiary creation/update callbacks for rails that require provider-side registration
- payout submission flows that embed recipient details inline

This keeps the sandbox useful across provider strategies and avoids forcing the core platform design to mirror only one fake PSP behavior.

Alternatives considered:

- Model only one sandbox strategy: simpler, but it would bias the platform design too early around one provider style.

## Risks / Trade-offs

- [Risk] Dynamic recipient requirements add API and UI complexity before payout execution exists. -> Mitigation: start with a narrow rail matrix and explicit requirement metadata so the same structure can expand later.
- [Risk] Hybrid provider registration strategy adds more states to recipient rails. -> Mitigation: keep the internal payout contract stable around `recipientRailId`, so only the provider adapter varies.
- [Risk] Supporting multi-rail recipients can complicate customer UX. -> Mitigation: keep recipient identity simple and surface rail-specific readiness clearly in the API and UI.
- [Risk] Sensitive rail data will require stronger security controls later. -> Mitigation: keep raw data write-only from customer flows and return only masked details from read APIs.

## Migration Plan

1. Add recipient onboarding specs for customer APIs, provider registration behavior, and payout linkage changes.
2. Implement recipient requirement discovery and recipient/rail creation in the API.
3. Add recipient onboarding pages/forms in the web app using the dynamic requirement contract.
4. Extend `apps/psp-sandbox` later with beneficiary registration and payout submission scenarios that exercise both provider strategies.
5. Update payout creation to consume `recipientRailId` instead of raw destination details when payout execution work begins.

## Open Questions

- Which initial rail matrix should be in scope for the first implementation: ACH, SEPA, and SWIFT only, or a narrower slice?
- Do we want recipient rails to be updatable in place, or should sensitive rail changes create a new rail record and archive the previous one?
- Should provider-side registration happen synchronously during recipient creation for the first implementation, or should it be explicitly asynchronous from the start?

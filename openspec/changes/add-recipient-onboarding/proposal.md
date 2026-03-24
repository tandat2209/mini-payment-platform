## Why

The platform has recipient read surfaces and payout-oriented schema foundations, but it does not yet support actually creating recipients before payout. We need a real recipient onboarding flow now because payout behavior, provider integration strategy, and rail-specific validation all depend on how beneficiary details are collected, stored, and referenced.

## What Changes

- Add customer-facing recipient onboarding APIs so a customer can create and manage recipients before submitting payouts.
- Add rail-requirement discovery for recipient onboarding so required fields can vary by rail, country, and currency.
- Add recipient onboarding behavior that stores recipient identity separately from rail-specific payout details and activation state.
- Add provider-aware recipient rail handling so the platform can either pre-create a PSP-side beneficiary when required or retain validated internal rail details for payout-time embedding when the provider supports it.
- Add payout submission rules that always reference an internal recipient rail identifier instead of accepting raw payout destination details inline from the customer payout flow.
- Add verification coverage and documentation for recipient creation and the platform-to-PSP sandbox handoff strategy.

## Capabilities

### New Capabilities

- `customer-recipient-onboarding-api`: Create and manage recipients and recipient rails through customer-facing APIs, including rail requirement discovery and activation state.
- `recipient-provider-registration`: Track provider-side beneficiary registration outcomes and provider recipient references for recipient rails when a rail or provider requires pre-registration.

### Modified Capabilities

- `customer-recipient-api`: Expand recipient APIs from read-only browsing to a fuller recipient lifecycle that reflects onboarding status and active rails.
- `payouts-and-recipients`: Require payouts to target previously created internal recipient rails and support rail-specific detail models, activation state, and provider linkage strategy.
- `provider-integration-and-reconciliation`: Extend provider integration behavior to cover outbound beneficiary registration, provider recipient references, and payout submission strategies that may differ by provider or rail.

## Impact

- Affected code: `apps/api`, `apps/web`, `apps/psp-sandbox`, and recipient/payout-related repositories and services.
- Affected APIs: new customer recipient onboarding endpoints, rail requirement discovery endpoints, and PSP sandbox recipient registration or payout submission contracts where needed.
- Affected systems: recipients, recipient rails, payout initiation, provider references, and payout execution strategy.
- Dependencies: existing recipient and payout schema foundations, current customer recipient read experience, and the PSP sandbox surface that will later exercise payout flows.

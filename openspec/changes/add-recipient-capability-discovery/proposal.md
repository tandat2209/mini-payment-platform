## Why

Recipient onboarding currently relies on rail, country, and currency options that are hardcoded in the web app. That makes the UI the source of truth for operational availability, which is brittle once provider coverage, regional rollout, or field requirements change over time.

## What Changes

- Add a customer-facing recipient capability discovery API so the backend owns which rails, countries, and currencies are currently available for onboarding.
- Add a backend-defined recipient form schema contract so the web app can render onboarding fields dynamically instead of hardcoding rail-specific field sets and option matrices.
- Extend recipient onboarding responses so the web app can follow backend-provided labels, options, validation hints, and capability constraints while keeping the existing requirement-validation boundary server-side.
- Update the customer web onboarding flow to consume capability discovery and schema metadata from the API rather than maintaining its own country and rail matrix.
- Ensure payout preparation continues to target saved `recipientRailId` records while relying on capability-driven onboarding configuration to decide which rails can become payout-ready.
- Add verification coverage and documentation for backend-driven capability discovery, dynamic field rendering, and future extensibility toward provider-specific schemas.

## Capabilities

### New Capabilities

- `recipient-capability-discovery-api`: Discover which recipient onboarding combinations are available by country, rail, and currency, with backend-owned capability metadata.
- `recipient-form-schema`: Expose a normalized recipient onboarding schema contract that lets clients render dynamic forms from backend-provided field metadata.

### Modified Capabilities

- `customer-recipient-api`: Extend customer recipient onboarding behavior so clients discover available rails and form configuration from the backend rather than frontend constants.
- `payouts-and-recipients`: Clarify that payout-targetable recipient rails come from backend-governed onboarding capabilities and saved recipient rail records, not inline client-side destination configuration.

## Impact

- Affected code: `apps/api`, `apps/web`, recipient onboarding services, recipient query contracts, and payout preparation boundaries.
- Affected APIs: new recipient capability discovery endpoint, expanded recipient requirement or schema responses, and updated web consumption of recipient onboarding metadata.
- Affected systems: customer recipient onboarding, payout preparation UX, provider capability rollout, and operational configuration management for supported payout rails.
- Dependencies: current recipient onboarding flow, existing recipient requirement resolution, and future provider-specific capability expansion for PSP sandbox and payout execution.

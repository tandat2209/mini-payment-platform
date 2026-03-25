## 1. Backend Capability Discovery Foundations

- [x] 1.1 Add backend-owned recipient capability contracts in `apps/api` for supported country, rail, and currency combinations.
- [x] 1.2 Implement a recipient capability resolver that reuses current onboarding rules and provider strategy metadata instead of duplicating a frontend matrix.
- [x] 1.3 Add automated coverage for supported and unsupported capability combinations.

## 2. Dynamic Schema Discovery APIs

- [x] 2.1 Add customer-facing recipient capability discovery endpoints that expose available onboarding combinations before recipient creation.
- [x] 2.2 Expand recipient requirement responses into a normalized onboarding schema contract with rendering and validation metadata.
- [x] 2.3 Add automated coverage for schema discovery responses, including required fields and provider-managed strategy hints.

## 3. Web Recipient Onboarding Migration

- [x] 3.1 Remove hardcoded country, rail, and currency onboarding matrices from the web recipient flow.
- [x] 3.2 Update the web recipient onboarding UI to populate selectors and dynamic fields from backend capability and schema responses.
- [x] 3.3 Preserve safe UI fallbacks for labels, empty states, and unsupported combinations while keeping the backend as the source of truth.

## 4. Payout Boundary Alignment And Documentation

- [x] 4.1 Ensure payout-preparation and recipient selection surfaces consume backend-governed recipient rail metadata rather than frontend capability assumptions.
- [ ] 4.2 Verify locally that onboarding availability changes are reflected in the web UI without frontend code changes.
- [x] 4.3 Document the capability-discovery model, normalized schema contract, and how it can later map to richer provider-style schemas similar to established payment platforms.

## Context

The current recipient onboarding flow validates rail details on the backend, but the web app still owns the visible rail and country matrix through frontend constants. That is acceptable for a narrow prototype, but it becomes a maintenance problem once provider coverage, rollout controls, country restrictions, or form fields change independently of the web deployment.

Well-known payment platforms generally avoid making the frontend the source of truth for onboarding coverage. Some expose capability-discovery APIs that return available payout routes or recipient combinations. Others go further and expose structured field metadata or form schemas so the UI can render dynamic onboarding without hardcoding every field set. We need a platform-level version of that pattern now so the current onboarding work scales cleanly into broader payout coverage.

This change touches `apps/api` and `apps/web` first, and prepares the ground for later provider-specific capability contributions from `apps/psp-sandbox` or real provider adapters.

## Goals / Non-Goals

**Goals:**

- Move recipient onboarding availability decisions out of the frontend and into backend-owned capability discovery.
- Provide one customer-facing API that tells the web app which countries, rails, and currencies can currently be used for recipient onboarding.
- Provide a normalized recipient field-schema contract that the web app can render dynamically.
- Keep server-side validation authoritative even when the UI is dynamically rendered from backend metadata.
- Preserve the existing internal payout model where payouts reference saved `recipientRailId` records.

**Non-Goals:**

- Replacing all onboarding validation with generic JSON Schema enforcement.
- Implementing provider-specific live capability fetches from external PSPs in this change.
- Building a full low-code form engine beyond the recipient onboarding use case.
- Implementing payout execution or retry flows.

## Decisions

### Decision: Add a dedicated capability discovery API above the field-requirements API

The backend will expose a top-level recipient capability discovery endpoint that returns currently available onboarding combinations by country, rail, and currency. This sits above the existing field-requirements behavior so the web app can first discover what is available, then ask for the specific schema or requirements for the chosen combination.

This keeps the frontend from guessing valid combinations and avoids overloading the requirement endpoint with discovery responsibilities.

Alternatives considered:

- Keep hardcoded country and rail selectors in the frontend and only validate on submit: too brittle and operationally unsafe.
- Expand the requirement endpoint to also list all supported combinations: possible, but it mixes discovery and detailed field-shape concerns into one less-clear contract.

### Decision: Use a normalized field-schema contract instead of raw provider-native JSON Schema

The API will expose a platform-owned recipient field schema with a constrained shape such as:

- field key
- label
- input kind
- required
- placeholder or help text
- options where applicable
- validation hints such as pattern or min/max length
- refresh dependencies when one field changes downstream choices

This gives the web app enough structure to render dynamic forms while keeping the schema understandable and stable across providers. It also avoids binding the platform directly to one provider’s exact JSON Schema conventions.

Alternatives considered:

- Return only the current simple field list forever: too limited once select fields, dependencies, or richer validation rules are needed.
- Return arbitrary provider-native JSON Schema: more flexible on paper, but leaks provider-specific semantics into platform contracts and complicates the frontend.

### Decision: Keep display metadata in the frontend, operational capability rules in the backend

The backend will own what is available and valid. The frontend may still own lightweight display concerns such as icons, layout, and fallback labels, but it will no longer decide which countries, rails, or currencies are supported.

This separation keeps rollout and operational policy in the right place while avoiding unnecessary backend ownership of pure presentation details.

Alternatives considered:

- Move all presentation labels and UI hints into the frontend only: still duplicates too much onboarding behavior and creates drift.
- Move every visual concern into the backend schema: possible, but overly couples API design to one client rendering style.

### Decision: Make capability and schema resolution provider-aware but configuration-driven

The backend capability service will derive support from internal configuration and requirement resolvers, not by fetching live provider metadata at request time. Provider-specific strategies can still influence the result, but the immediate source of truth remains platform configuration.

This keeps the change reliable, testable, and fast while still leaving room for later provider adapters to contribute capability metadata.

Alternatives considered:

- Fetch provider coverage live on every request: operationally risky and unnecessary for the current phase.
- Ignore provider strategy and expose only product-level rails: too coarse once rollout and provider behavior diverge.

## Risks / Trade-offs

- [Risk] The schema contract could become too generic and hard to evolve. -> Mitigation: keep the initial schema narrowly tailored to recipient onboarding and add fields only when a real use case needs them.
- [Risk] Capability discovery and requirement resolution could drift apart. -> Mitigation: back both endpoints with the same resolver or shared capability source.
- [Risk] The web UI may become dependent on backend metadata quality. -> Mitigation: define required schema fields clearly and keep safe UI fallbacks for labels and unsupported states.
- [Risk] Future provider-native schemas may not map perfectly to the platform format. -> Mitigation: use a normalized platform contract with explicit extension points rather than raw passthrough payloads.

## Migration Plan

1. Add proposal, specs, and tasks for recipient capability discovery and schema-driven onboarding.
2. Implement backend capability discovery and normalized schema resolution in `apps/api`.
3. Update the web recipient onboarding flow to consume the new endpoint and remove hardcoded country or rail matrices.
4. Verify that onboarding still validates correctly for supported combinations and hides unsupported combinations from the UI.
5. Document how provider-specific capability expansion should plug into the platform-owned discovery model later.

## Open Questions

- Should the initial capability endpoint include country display names, or should the web own a lightweight country-label map?
- Do we want one combined response that includes both availability and schema for the currently selected combination, or two separate endpoints from the start?
- How much validation metadata should be in the schema contract initially: just required fields and input kinds, or also regex, examples, and dependency refresh rules?

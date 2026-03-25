# Recipient Capability Discovery

The recipient onboarding flow is now backend-driven.

The web app no longer hardcodes which countries, payout rails, or currencies are available. It
first asks the API what onboarding combinations are currently enabled, then asks for the field
schema for the selected combination.

## Why this exists

Frontend-owned onboarding matrices drift quickly once provider coverage changes.

The platform now follows this model:

- backend owns operational capability rules
- frontend owns rendering, layout, labels, and safe fallbacks
- payout flows continue to reference saved `recipientRailId` records instead of raw beneficiary
  details

This keeps rollout and validation policy in one place while still allowing the UI to render
dynamic onboarding forms.

## Capability discovery API

`GET /customers/me/recipients/capabilities`

Example response:

```json
{
  "items": [
    {
      "countryCode": "US",
      "countryName": "United States",
      "rails": [
        {
          "rail": "ach",
          "description": "US domestic bank rails",
          "providerRegistrationStrategy": "platform_managed",
          "currencies": [{ "currency": "USD" }]
        },
        {
          "rail": "swift",
          "description": "Cross-border bank transfer",
          "providerRegistrationStrategy": "provider_managed",
          "currencies": [{ "currency": "USD" }, { "currency": "EUR" }]
        }
      ]
    }
  ]
}
```

This endpoint answers:

- which countries are currently enabled
- which rails are supported for each country
- which currencies are valid for each rail
- whether a rail is `platform_managed` or `provider_managed`

The current implementation derives this from the shared recipient requirement resolver, so
capability discovery and server-side validation stay aligned.

## Normalized field schema API

`GET /customers/me/recipients/requirements?countryCode=DE&rail=sepa&currency=EUR`

Example response:

```json
{
  "countryCode": "DE",
  "currency": "EUR",
  "rail": "sepa",
  "initialReadinessStatus": "pending_provider_registration",
  "providerRegistrationStrategy": "provider_managed",
  "fields": [
    {
      "key": "iban",
      "label": "IBAN",
      "kind": "iban",
      "required": true,
      "placeholder": "DE89370400440532013000",
      "helpText": "Provide the beneficiary IBAN without spaces if possible.",
      "pattern": "^[A-Z]{2}[A-Z0-9]{13,32}$",
      "minLength": 15,
      "maxLength": 34
    }
  ]
}
```

This normalized schema is intentionally narrower than raw provider-native JSON Schema. It exposes
only the platform-level metadata the current UI needs:

- field key
- label
- input kind
- required state
- placeholder
- help text
- validation hints such as regex and length bounds

That keeps the contract stable while leaving room for richer schema features later.

## Current platform rules

Today the resolver exposes:

- `US + ach + USD`
  - `platform_managed`
  - becomes active immediately after validation
- `SEPA country + sepa + EUR`
  - `provider_managed`
  - starts `pending_provider_registration`
- `any supported country + swift + USD/EUR`
  - `provider_managed`
  - starts `pending_provider_registration`

The web app should treat this data as authoritative.

## Relationship to payouts

Capability discovery only decides what can be onboarded.

Payout preparation still works from saved recipient rails:

- the customer picks a previously saved `recipientRailId`
- the API resolves the stored rail
- provider submission strategy comes from that rail's metadata
- customer payout requests do not resubmit raw bank details inline

This keeps onboarding discovery and payout execution aligned without coupling the payout flow to a
frontend capability matrix.

## How this can evolve

Well-known payment platforms often go further and expose provider-style form metadata or richer
schema contracts.

This project is set up to grow in that direction without breaking the current UI contract:

- add selectable options for provider-driven enums
- add field dependency metadata for downstream refreshes
- add provider extension fields without leaking raw provider schemas into the public API
- let future provider adapters contribute capability inputs while keeping the platform response
  normalized

The important rule stays the same:

- backend owns onboarding capability and validation policy
- frontend renders whatever the platform says is currently allowed

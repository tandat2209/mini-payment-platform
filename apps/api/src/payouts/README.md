# Payouts Domain

Customer payout APIs, admin payout operations, provider adapters, and payout jobs should live here.

The internal payout boundary is now anchored on `recipientRailId`.

- Customer payout requests should reference a previously saved `recipientRailId`.
- Raw beneficiary details stay on the stored recipient rail and are never resubmitted inline by the customer.
- Provider adapters derive submission strategy from the recipient rail:
  - `provider_managed` rails use the stored provider beneficiary reference
  - `platform_managed` rails embed the stored rail details at submission time
- Recipient onboarding availability is governed by the recipients capability-discovery APIs rather
  than any frontend-owned rail matrix.
- Payout selection surfaces should only work from saved recipient rail metadata returned by the
  API, not from assumed rail support in the client.

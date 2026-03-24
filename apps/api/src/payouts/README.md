# Payouts Domain

Customer payout APIs, admin payout operations, provider adapters, and payout jobs should live here.

The internal payout boundary is now anchored on `recipientRailId`.

- Customer payout requests should reference a previously saved `recipientRailId`.
- Raw beneficiary details stay on the stored recipient rail and are never resubmitted inline by the customer.
- Provider adapters derive submission strategy from the recipient rail:
  - `provider_managed` rails use the stored provider beneficiary reference
  - `platform_managed` rails embed the stored rail details at submission time

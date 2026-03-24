## 1. Recipient Domain And Requirement Foundations

- [x] 1.1 Add recipient and recipient-rail write-side contracts in `apps/api`, including rail-specific detail storage, readiness state, and provider registration strategy.
- [x] 1.2 Implement recipient requirement resolution for the initial rail matrix so required fields vary by rail, country, and currency.
- [x] 1.3 Add automated coverage for recipient requirement discovery, recipient creation, and validation failures for missing required rail details.

## 2. Customer Recipient Onboarding APIs And Web Flow

- [x] 2.1 Add customer-facing API endpoints for recipient requirement discovery, recipient creation, and adding a new rail to an existing recipient.
- [x] 2.2 Expand the existing customer recipient read responses to include rail onboarding or payout-readiness status while keeping sensitive identifiers masked.
- [x] 2.3 Build the web recipient onboarding flow so a customer can create a recipient, select a rail, enter dynamic rail details, and review the saved result.

## 3. Provider Registration Strategy And Payout Linkage

- [ ] 3.1 Implement recipient rail provider-registration persistence so provider-managed rails can store external beneficiary references and failed registration outcomes.
- [ ] 3.2 Add PSP sandbox support for beneficiary creation and validation scenarios needed by the initial provider-managed rails.
- [ ] 3.3 Update payout design contracts and write-side boundaries so future payout creation references `recipientRailId` instead of inline destination details.

## 4. Integration Verification And Documentation

- [ ] 4.1 Verify that recipient creation works for at least one inline-detail rail and one provider-managed rail in the local environment.
- [ ] 4.2 Verify that a failed provider registration keeps the recipient rail unavailable for payout while preserving the failure reason for retry or correction.
- [ ] 4.3 Document the recommended recipient onboarding model, the rail requirement matrix, and when the platform pre-registers a beneficiary with the PSP versus embedding details at payout time.

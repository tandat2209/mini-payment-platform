## MODIFIED Requirements

### Requirement: Payouts store business-level payout intent

The system SHALL store payouts as business objects that capture the initiating user, wallet, recipient, recipient rail, gross amount, fee amount, net amount, currency, and payout lifecycle state. Payout creation SHALL reference a previously created internal recipient rail and SHALL NOT require raw destination details inline from the customer payout request. After booking, payouts SHALL be able to transition through provider submission, terminal provider outcomes, and post-settlement returned outcomes without losing the original booked business record.

#### Scenario: User creates payout request

- **WHEN** a user initiates a payout from the app
- **THEN** the schema stores a payout record with the information needed to track the payout independently of provider retries and later return events

### Requirement: Payout lifecycle supports sync and async rails

The system SHALL support payout state transitions that can be completed immediately from the PSP response or later from provider events. The lifecycle SHALL support at least booking, provider submission, in-flight processing, terminal success, terminal failure, and post-settlement return. Returned outcomes SHALL support cases where the actual returned amount differs from the original gross amount, but the payout-facing status SHALL remain `returned` for the first slice.

#### Scenario: Payout is returned after settlement

- **WHEN** a previously paid payout later receives a provider return event
- **THEN** the payout lifecycle transitions to a distinct returned state rather than being rewritten as failed

#### Scenario: Payout is partially returned after settlement

- **WHEN** a previously paid payout later receives a provider return event for less than the original gross amount
- **THEN** the payout record preserves the `returned` lifecycle outcome and stores the actual returned amount separately from the original payout amounts

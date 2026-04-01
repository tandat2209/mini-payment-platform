## MODIFIED Requirements

### Requirement: Payouts store business-level payout intent

The system SHALL store payouts as business objects that capture the initiating user, wallet, recipient, recipient rail, gross amount, fee amount, net amount, currency, and payout lifecycle state. Payout creation SHALL reference a previously created internal recipient rail and SHALL NOT require raw destination details inline from the customer payout request. After booking, payouts SHALL be able to transition through provider submission and terminal provider outcome states without losing the original booked business record.

#### Scenario: User creates payout request

- **WHEN** a user initiates a payout from the app
- **THEN** the schema stores a payout record with the information needed to track the payout independently of provider retries

### Requirement: Payout attempts store provider execution history

The system SHALL store each PSP submission or retry for a payout as a distinct payout attempt record with provider references, request or response payloads, and outcome state. Provider callbacks SHALL resolve or advance the relevant attempt instead of overwriting earlier attempt history.

#### Scenario: Payout is retried after provider failure

- **WHEN** a payout submission fails or times out and the platform retries it
- **THEN** the schema stores a new payout attempt without overwriting the earlier provider interaction record

### Requirement: Payout lifecycle supports sync and async rails

The system SHALL support payout state transitions that can be completed immediately from the PSP response or later from a webhook. The lifecycle SHALL support at least booking, provider submission, in-flight processing, terminal success, and terminal failure.

#### Scenario: Asynchronous rail completes via webhook

- **WHEN** a payout rail accepts the payout synchronously but finalizes it asynchronously
- **THEN** the schema can store an in-progress payout state and later transition it to a terminal state after provider notification

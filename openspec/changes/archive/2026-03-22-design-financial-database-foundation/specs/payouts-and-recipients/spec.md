## ADDED Requirements

### Requirement: Recipients support multiple rail details

The system SHALL store recipients separately from their rail-specific payment details so one recipient can be paid through multiple supported payout methods.

#### Scenario: Recipient has more than one payout method

- **WHEN** a recipient can receive payment through multiple rails
- **THEN** the schema can associate multiple recipient rail detail records with that recipient

### Requirement: Payouts store business-level payout intent

The system SHALL store payouts as business objects that capture the initiating user, wallet, recipient, rail, gross amount, fee amount, net amount, currency, and payout lifecycle state.

#### Scenario: User creates payout request

- **WHEN** a user initiates a payout from the app
- **THEN** the schema stores a payout record with the information needed to track the payout independently of provider retries

### Requirement: Payout attempts store provider execution history

The system SHALL store each PSP submission or retry for a payout as a distinct payout attempt record with provider references and outcome state.

#### Scenario: Payout is retried after provider failure

- **WHEN** a payout submission fails or times out and the platform retries it
- **THEN** the schema stores a new payout attempt without overwriting the earlier provider interaction record

### Requirement: Payout lifecycle supports sync and async rails

The system SHALL support payout state transitions that can be completed immediately from the PSP response or later from a webhook.

#### Scenario: Asynchronous rail completes via webhook

- **WHEN** a payout rail accepts the payout synchronously but finalizes it asynchronously
- **THEN** the schema can store an in-progress payout state and later transition it to a terminal state after provider notification

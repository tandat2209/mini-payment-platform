# payouts-and-recipients Specification

## Purpose

Define the schema requirements for recipient storage, payout business records, and payout execution history.

## Requirements

### Requirement: Recipients support multiple rail details

The system SHALL store recipients separately from their rail-specific payment details so one recipient can be paid through multiple supported payout methods. Each recipient rail SHALL support rail-specific detail fields, country and currency context, and its own payout-readiness status.

#### Scenario: Recipient has more than one payout method

- **WHEN** a recipient can receive payment through multiple rails
- **THEN** the schema can associate multiple recipient rail detail records with the recipient without forcing those rails to share one readiness state

### Requirement: Payouts store business-level payout intent

The system SHALL store payouts as business objects that capture the initiating user, wallet, recipient, recipient rail, gross amount, fee amount, net amount, currency, and payout lifecycle state. Payout creation SHALL reference a previously created internal recipient rail and SHALL NOT require raw destination details inline from the customer payout request.

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

### Requirement: Payout submission strategy depends on recipient rail capability

The system SHALL allow payout execution to derive its provider submission strategy from the recipient rail, so a payout can either reference a previously registered provider beneficiary or embed stored rail details when the provider supports inline destination submission.

#### Scenario: Payout uses provider-registered beneficiary

- **WHEN** a payout targets a recipient rail whose strategy requires provider registration
- **THEN** the payout execution path uses the stored provider recipient reference instead of reconstructing raw destination fields at submission time

### Requirement: Payout-targetable recipient rails come from backend-governed onboarding capabilities

The system SHALL only allow payout preparation to target recipient rails created through backend-governed onboarding capabilities and saved internal recipient rail records.

#### Scenario: Client prepares payout for a saved recipient rail

- **WHEN** a payout preparation flow references a saved `recipientRailId`
- **THEN** the system uses the saved rail and its backend-governed onboarding metadata instead of requiring inline destination configuration from the client

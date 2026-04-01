## ADDED Requirements

### Requirement: PSP sandbox can accept payout submissions

The PSP sandbox SHALL expose a payout submission API that accepts a booked payout request, returns provider request identifiers, and indicates whether the payout is immediately accepted for processing.

#### Scenario: PSP sandbox accepts payout submission

- **WHEN** the platform submits a valid payout request to the PSP sandbox
- **THEN** the PSP sandbox returns a provider request identifier, a provider payout identifier, and an initial accepted or in-progress outcome

### Requirement: PSP sandbox can emit payout status callbacks

The PSP sandbox SHALL expose a way to deliver payout lifecycle updates back to the API so asynchronous payout completion or failure can be tested locally.

#### Scenario: PSP sandbox sends terminal payout callback

- **WHEN** the sandbox determines that a submitted payout has completed or failed
- **THEN** it sends a callback payload containing the provider payout identifier, terminal status, and occurrence timestamp to the configured API endpoint

### Requirement: PSP sandbox keeps a database seam for later reporting

The PSP sandbox SHALL remain lightweight in this slice, but it SHALL preserve a database seam so later provider-style settlement or reconciliation simulations can read from platform payout records without introducing separate sandbox-owned payout tables yet.

#### Scenario: Sandbox simulates callback using platform payout records

- **WHEN** the platform later asks the sandbox to simulate a payout status update for a submitted provider payout identifier
- **THEN** the sandbox can resolve the needed request and payout context from platform payout records through its database seam

### Requirement: PSP sandbox supports deterministic payout outcome simulation

The PSP sandbox SHALL allow tests or operators to control whether a submitted payout later succeeds or fails so payout lifecycle paths can be verified repeatably.

#### Scenario: Caller requests payout failure simulation

- **WHEN** a payout is submitted with a sandbox outcome that indicates failure
- **THEN** the sandbox eventually emits a failed payout update instead of a paid update

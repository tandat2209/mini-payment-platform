## ADDED Requirements

### Requirement: PSP sandbox can emit payout return events for paid payouts

The PSP sandbox SHALL expose a deterministic way to emit a payout return event for a payout that was previously accepted and settled as paid.

#### Scenario: Operator simulates returned payout

- **WHEN** the operator or test harness requests a return for a previously paid payout in the PSP sandbox
- **THEN** the PSP sandbox emits a payout return event tied to the same provider payout identifier

### Requirement: Payout return events preserve linkage to the original provider payout

The PSP sandbox SHALL include the provider payout identifier, provider event identifier, occurrence timestamp, and returned status information needed for the platform to attach the return to the original payout attempt and payout.

#### Scenario: API receives return event from sandbox

- **WHEN** the PSP sandbox sends a payout return event
- **THEN** the payload contains the provider identifiers and timestamps needed to resolve the original payout lineage

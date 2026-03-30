## ADDED Requirements

### Requirement: Returned payouts create post-settlement compensating ledger postings

The system SHALL create balanced compensating ledger postings when a previously paid payout is later returned, reversing the settled payout impact in an append-only manner. Those postings SHALL use the actual returned amount and SHALL NOT assume the customer always receives the original gross amount back.

#### Scenario: Paid payout is returned

- **WHEN** a payout that was already settled as paid later transitions to returned
- **THEN** the system posts balanced ledger transactions that reverse the post-settlement payout effects without mutating the original settlement history

#### Scenario: Paid payout is returned after fee deduction

- **WHEN** a payout that was already settled as paid later returns for less than the original gross amount
- **THEN** the system posts balanced ledger transactions based on the actual returned amount and reverses fee revenue in full for the first slice

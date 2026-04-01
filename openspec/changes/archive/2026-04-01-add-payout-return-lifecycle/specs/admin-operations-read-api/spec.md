## MODIFIED Requirements

### Requirement: Admin read APIs expose payout, webhook, and reconciliation views

The system SHALL expose admin read models for payout operations, webhook processing, and reconciliation exceptions so those workspaces can be implemented without direct database inspection. These read models SHALL include returned payout state and linked return-event context.

#### Scenario: Operator opens returned payout

- **WHEN** the operator opens a payout workspace row or detail for a returned payout
- **THEN** the system returns the returned payout state and the linked provider return context needed for investigation

### Requirement: Admin read APIs support cross-linking between operational domains

The system SHALL expose identifiers and linked context needed to navigate between transactions, ledger postings, payouts, webhooks, payout return events, and reconciliation records.

#### Scenario: Operator follows returned-payout investigation path

- **WHEN** the operator opens a returned payout detail
- **THEN** the response includes enough linked context to continue the investigation into the related webhook event, ledger postings, and reconciliation workspace

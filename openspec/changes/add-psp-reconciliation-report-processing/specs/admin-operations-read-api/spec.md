## MODIFIED Requirements

### Requirement: Admin read APIs expose payout, webhook, and reconciliation views

The system SHALL expose admin read models for payout operations, webhook processing, reconciliation report batches, reconciliation report line outcomes, and reconciliation exceptions so those workspaces can be implemented without direct database inspection.

#### Scenario: Operator opens payout operations

- **WHEN** the operator opens a payouts workspace
- **THEN** the system returns payout lifecycle, provider attempt state, and related identifiers needed for operations

#### Scenario: Operator opens reconciliation workspace

- **WHEN** the operator opens a reconciliation workspace
- **THEN** the system returns reconciliation report batches, line-level reconciliation outcomes, and unresolved or mismatched operational records suitable for triage

### Requirement: Admin read APIs support cross-linking between operational domains

The system SHALL expose identifiers and linked context needed to navigate between transactions, ledger postings, payouts, webhooks, reconciliation report batches, reconciliation report lines, and reconciliation records.

#### Scenario: Operator follows a linked investigation path

- **WHEN** the operator opens a transaction, payout, webhook, reconciliation report, or reconciliation exception detail
- **THEN** the response includes enough linked context to continue the investigation in related admin workspaces

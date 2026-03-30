## ADDED Requirements

### Requirement: Provider reconciliation report webhooks are stored and deduplicated

The system SHALL accept PSP reconciliation report webhook deliveries, persist the raw report payload, and deduplicate repeated deliveries by provider and provider report identifier.

#### Scenario: Duplicate report webhook is replayed

- **WHEN** the PSP sends the same reconciliation report webhook more than once
- **THEN** the system stores at most one reconciliation report batch for that provider report identifier

### Requirement: Reconciliation report batches and lines are normalized for processing

The system SHALL create one reconciliation report batch record per accepted provider report and SHALL create normalized reconciliation report line records for each payout-related line in that report.

#### Scenario: Daily reconciliation report is accepted

- **WHEN** the PSP sends a valid daily reconciliation report containing payout lines
- **THEN** the system stores the batch metadata, raw payload, and one normalized internal record for each report line

### Requirement: Reconciliation report lines produce explicit matching outcomes for provider-present lines

The system SHALL process each reconciliation report line into an explicit outcome such as `matched`, `timing_difference`, `status_mismatch`, `amount_mismatch`, `provider_only`, `duplicate_provider_line`, or `unsupported_report_line`. `internal_only` outcomes SHALL NOT be created during initial report-line ingestion because they represent expected-but-missing internal records rather than facts present in the provider payload.

#### Scenario: Report line exactly matches a payout attempt

- **WHEN** a provider report line matches an internal payout attempt by provider identifiers, currency, amounts, and terminal status
- **THEN** the system marks that line as `matched`

#### Scenario: Report line has no matching payout attempt

- **WHEN** a provider report line cannot be matched to any internal payout attempt or payout
- **THEN** the system marks that line as `provider_only`

#### Scenario: Report line matches a payout attempt but differs materially

- **WHEN** a provider report line matches a known payout attempt but its status or amounts differ from internal records
- **THEN** the system marks that line as `status_mismatch` or `amount_mismatch` instead of auto-matching it

### Requirement: Expected-but-missing internal payouts are identified in a delayed sweep

The system SHALL identify `internal_only` reconciliation cases through a separate delayed sweep that evaluates payout attempts expected to appear in closed provider report windows and confirms they still have no matching provider report line.

#### Scenario: Payout remains absent after the report window closes

- **WHEN** a scheduled reconciliation sweep evaluates an eligible payout attempt after its expected provider report window has closed and still finds no matching provider report line
- **THEN** the system creates or updates an `internal_only` reconciliation outcome outside the initial report-ingestion path

### Requirement: Unsupported report lines are stored without being discarded

The system SHALL preserve unsupported or not-yet-modeled provider report lines so future reconciliation logic can inspect them.

#### Scenario: Provider sends unsupported line type

- **WHEN** a reconciliation report contains a line type the platform does not yet model
- **THEN** the system stores the line and marks it as `unsupported_report_line`

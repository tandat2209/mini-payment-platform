## ADDED Requirements

### Requirement: Simulator can trigger demo funding webhook deliveries

The simulator SHALL expose an API that accepts explicit funding inputs and delivers a demo `funding.completed` webhook payload to the configured application webhook endpoint. The trigger request SHALL support targeting a specific funding detail and customer context.

#### Scenario: Simulator triggers funding delivery successfully

- **WHEN** a caller submits a valid simulator funding request with amount, currency, customer identity, and funding detail identity
- **THEN** the simulator sends a demo funding webhook to the configured application endpoint and returns the delivery result with the provider event identifier

### Requirement: Simulator can replay a provider event identifier intentionally

The simulator SHALL allow callers to supply an explicit provider external event identifier so duplicate-delivery behavior can be tested. If no external event identifier is supplied, the simulator SHALL generate one.

#### Scenario: Caller replays a provider event id

- **WHEN** a caller submits a funding simulation request with an explicit external event identifier
- **THEN** the simulator uses that identifier in the outbound webhook payload instead of generating a new one

#### Scenario: Caller omits a provider event id

- **WHEN** a caller submits a funding simulation request without an external event identifier
- **THEN** the simulator generates a new provider event identifier for the outbound webhook payload

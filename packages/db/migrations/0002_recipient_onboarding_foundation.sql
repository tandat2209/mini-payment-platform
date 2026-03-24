CREATE TYPE recipient_rail_readiness_status AS ENUM (
  'draft',
  'pending_provider_registration',
  'active',
  'failed',
  'archived'
);

CREATE TYPE recipient_provider_registration_strategy AS ENUM (
  'platform_managed',
  'provider_managed'
);

ALTER TABLE recipient_rails
  ADD COLUMN country_code CHAR(2),
  ADD COLUMN readiness_status recipient_rail_readiness_status NOT NULL DEFAULT 'active',
  ADD COLUMN provider_registration_strategy recipient_provider_registration_strategy NOT NULL DEFAULT 'platform_managed',
  ADD COLUMN provider_reference TEXT,
  ADD COLUMN provider_registration_error TEXT,
  ADD COLUMN provider_registered_at TIMESTAMPTZ;

UPDATE recipient_rails
SET country_code = CASE
  WHEN rail = 'sepa' THEN 'DE'
  WHEN rail = 'swift' THEN 'GB'
  ELSE 'US'
END
WHERE country_code IS NULL;

ALTER TABLE recipient_rails
  ALTER COLUMN country_code SET NOT NULL;

ALTER TABLE recipient_rails
  ADD CONSTRAINT recipient_rails_country_code_uppercase
    CHECK (country_code = UPPER(country_code));

CREATE INDEX recipient_rails_readiness_status_idx
  ON recipient_rails(readiness_status);

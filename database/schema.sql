-- Run this once against the Neon Postgres database configured in DATABASE_URL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS newsforge_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  config jsonb NOT NULL,
  management_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  published_at timestamptz,
  custom_domain text UNIQUE,
  domain_verified boolean NOT NULL DEFAULT false,
  domain_status text NOT NULL DEFAULT 'none'
);

CREATE INDEX IF NOT EXISTS newsforge_projects_expiry_idx
  ON newsforge_projects (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS newsforge_projects_domain_idx
  ON newsforge_projects (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;

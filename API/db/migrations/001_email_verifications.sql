CREATE TABLE IF NOT EXISTS email_verifications (
  email TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO email_verifications (email, token_hash, expires_at, verified_at)
SELECT email, NULL, NOW(), NOW()
FROM users
ON CONFLICT (email) DO NOTHING;

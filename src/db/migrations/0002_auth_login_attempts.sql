CREATE TABLE IF NOT EXISTS auth_login_attempts (
  key_hash varchar(64) PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_ends_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_login_attempts_window_ends_at_idx
  ON auth_login_attempts(window_ends_at);

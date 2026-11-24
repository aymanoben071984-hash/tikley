# Security implementation notes

## Initial administrator bootstrap

1. Apply the SQL migration in `src/db/migrations/0001_auth.sql` to the PostgreSQL database.
2. Set `TIKLEY_BOOTSTRAP_SECRET` to a high-entropy one-time secret in the deployment environment.
3. Send one POST to `/api/auth/bootstrap` with JSON `{"email":"admin@example.com","password":"a-long-unique-password"}` and header `x-tikley-bootstrap-secret: <secret>`.
4. Remove `TIKLEY_BOOTSTRAP_SECRET` from the deployment environment immediately after receiving HTTP 201.
5. Sign in at `/login`. Bootstrap cannot create another user once any user exists.

Passwords use Node.js scrypt with per-password random salts. Session tokens are random opaque values; only SHA-256 token digests are stored in PostgreSQL. Session cookies are HttpOnly, SameSite=Lax, Secure in production, and expire after seven days.

## Operational caveats

- Login throttling in this initial patch is process-local. Put a shared edge/WAF or Redis-backed limiter in front of `/api/auth/login` before running multiple serverless instances.
- Apply the migration before deploying the application. The code intentionally does not auto-create auth tables at runtime.
- Keep `TIKLEY_INGEST_TOKEN` secret and rotate it if the worker is compromised.
- Overlay read endpoints remain unauthenticated for OBS Browser Source compatibility. Their returned data should be treated as public. A follow-up should introduce per-overlay scoped signed read tokens and remove unnecessary profile/event fields.
- The public event ingestion route is restricted to the worker bearer token; dashboard test-event generation must be moved to a separately authenticated admin-only internal path before relying on test mode.
- Review rate limits, event idempotency, media URL allowlisting, and production security headers before production rollout.

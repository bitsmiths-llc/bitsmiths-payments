# Deploy: self-hosted Postgres for `payment_links` on Coolify

Handoff brief. The **app code is already migrated** off Supabase onto plain
Postgres (postgres.js). Your job is the infra: stand up a Postgres on Coolify,
run two SQL files, and wire one env var into the payments app. No app code
changes are required.

## What the app needs

- A Postgres database the app reaches over Coolify's **internal** network.
- One table (`payment_links`) + a trigger, created by `db/001_payment_links.sql`.
- A **least-privilege login role** `payments_app` (SELECT/INSERT/UPDATE only),
  created by `db/002_app_role.sql`. The app connects as this role — **never** the
  superuser.
- One runtime env var on the app service: `DATABASE_URL`.

The app's only DB code paths: read a link by slug (`getPaymentLink`), mark a
link paid (`markPaymentLinkPaid`), and insert a link (the `pnpm checkout` CLI).
No auth, realtime, storage, RLS, or PostgREST — those are gone.

## Steps

### 1. Provision Postgres (Coolify one-click)
- New Resource → **Database → PostgreSQL** (v15 or 16 is fine).
- Database name: `payments`.
- Let Coolify generate the superuser password.
- **Security: do NOT enable the public port.** Keep it internal-only. The app
  runs in the same Coolify project and reaches Postgres by its internal
  hostname. Only expose a public port temporarily if you need external admin
  access, then disable it again.

### 2. Create the schema + role
Open the DB's terminal in Coolify (or `psql` into the container) **as the
superuser** and run, in order:

1. `db/001_payment_links.sql` — extension, table, index, trigger.
2. `db/002_app_role.sql` — **first edit it**: replace
   `REPLACE_WITH_STRONG_PASSWORD` with a fresh secret
   (`openssl rand -base64 32`). This creates `payments_app` with only
   SELECT/INSERT/UPDATE on `payment_links` and a 5s `statement_timeout`.

Copy the files in via the Coolify terminal, or paste their contents into `psql`.

### 3. Wire the app env
On the **payments app** service in Coolify, set this runtime env var:

```
DATABASE_URL=postgres://payments_app:<the-password-from-step-2>@<postgres-internal-host>:5432/payments
```

- `<postgres-internal-host>` is the Postgres resource's **internal** hostname
  (Coolify shows it on the resource page / in its internal connection string).
- It's a **runtime** var — do NOT add it as a Docker build ARG. The image
  already builds without it; DB calls only happen at request time.
- **Remove** the old `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` vars.
- Redeploy the app service.

## Security checklist (must all be true)
- [ ] Postgres has **no public port** (internal Docker network only).
- [ ] App connects as `payments_app`, **not** the superuser.
- [ ] `payments_app` has SELECT/INSERT/UPDATE on `payment_links` only — no
      DELETE, no DDL, no other objects.
- [ ] `payments_app` password is a fresh 32-byte random secret, stored only in
      Coolify's encrypted env (and Ali's local `.env.local`) — never committed,
      never in the image.
- [ ] Superuser password is not reused as the app password.
- [ ] Automated backups enabled on the Postgres resource (Coolify → the DB →
      Backups; daily, ideally to S3-compatible storage).

## Verify
1. Schema: `psql ... -c '\d payment_links'` shows the table + trigger.
2. Least privilege: connect **as `payments_app`** and confirm
   `delete from payment_links;` is rejected (permission denied) while
   `select count(*) from payment_links;` works.
3. App boots after redeploy with no `DATABASE_URL is not configured` error.
4. End-to-end: run `pnpm checkout` (needs `DATABASE_URL` + `STRIPE_SECRET_KEY`
   locally) to create a link, then open `/pay/<slug>` and confirm it renders.

## Notes
- The old `supabase/migrations/` dir is superseded by `db/` and can be deleted
  once this is live (left in place for now).
- Local dev: Ali points `.env.local`'s `DATABASE_URL` at whatever Postgres he's
  testing against (a temporary Coolify public endpoint, or a local container).

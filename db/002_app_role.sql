-- Least-privilege application role for the payments app.
--
-- Run ONCE as a superuser, AFTER 001_payment_links.sql.
-- BEFORE running: replace the password placeholder with a long random secret
-- (e.g. `openssl rand -base64 32`). The app connects as THIS role — never as
-- the Postgres superuser.

do $$
begin
  if not exists (select from pg_roles where rolname = 'payments_app') then
    create role payments_app login password 'REPLACE_WITH_STRONG_PASSWORD';
  end if;
end
$$;

-- Grant only what the app actually does:
--   getPaymentLink   -> select
--   stripe-checkout  -> insert
--   markPaymentLinkPaid -> update
-- No DELETE, no DDL, no access to any other object. The role cannot drop the
-- table, read other schemas, or create objects.
grant usage on schema public to payments_app;
grant select, insert, update on public.payment_links to payments_app;

-- The id default uses gen_random_uuid() (no sequences), so no sequence grants
-- are needed. The updated_at trigger runs without an EXECUTE grant.

-- Defense in depth: cap runaway queries issued by this role.
alter role payments_app set statement_timeout = '5s';

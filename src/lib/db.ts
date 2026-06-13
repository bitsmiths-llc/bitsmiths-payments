import postgres, { type Sql } from 'postgres';
import 'server-only';

let _sql: Sql | null = null;

/**
 * Lazily-created Postgres connection pool for the running Next server.
 *
 * - One pool for the long-lived standalone `node server.js` process (see
 *   Dockerfile); `max` is intentionally small — this app issues only a handful
 *   of concurrent queries.
 * - Lazy init mirrors the previous Supabase `admin()` pattern so a missing
 *   `DATABASE_URL` never crashes `next build` (the value is runtime-only and is
 *   not baked into the image as a build ARG).
 * - Temporal columns (`timestamp`/`timestamptz`/`date`) are returned as their
 *   raw Postgres strings rather than JS `Date`s, so runtime values match the
 *   `string` types on `PaymentLinkRow` — the same shape PostgREST returned.
 */
export function db(): Sql {
  if (_sql) return _sql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  _sql = postgres(connectionString, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    types: {
      // Keep date/time columns as strings instead of JS Date objects.
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (v: string) => v,
        parse: (v: string) => v,
      },
    },
  });

  return _sql;
}

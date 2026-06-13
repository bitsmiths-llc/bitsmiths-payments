#!/usr/bin/env bash
# Ensure an SSH tunnel to the internal Coolify Postgres, then run the checkout CLI.
#
# The production DB has no public port, so `pnpm checkout` (which runs on your
# machine) reaches it through this tunnel. DATABASE_URL in .env.local points at
# localhost:$LOCAL_PORT. We resolve the DB container's IP dynamically each run so
# the tunnel keeps working even if the Postgres container restarts with a new IP.
set -uo pipefail

LOCAL_PORT=6543
SSH_HOST=hetzner-coolify
PG_CONTAINER=psso00ww8cws0wkgc0ocwkoc

if nc -z localhost "$LOCAL_PORT" 2>/dev/null; then
  echo "✓ DB tunnel already up on localhost:$LOCAL_PORT"
else
  echo "Opening DB tunnel (localhost:$LOCAL_PORT → $PG_CONTAINER:5432 via $SSH_HOST)…"
  PG_IP=$(ssh -o ConnectTimeout=10 "$SSH_HOST" \
    "docker inspect $PG_CONTAINER --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'" 2>/dev/null)
  if [ -z "${PG_IP:-}" ]; then
    echo "✗ Could not resolve the DB container IP via $SSH_HOST. Is the Postgres resource running?"
    exit 1
  fi
  ssh -fNT -o ExitOnForwardFailure=yes -o ConnectTimeout=10 \
    -L "$LOCAL_PORT:$PG_IP:5432" "$SSH_HOST" || { echo "✗ tunnel failed to open"; exit 1; }
  nc -z localhost "$LOCAL_PORT" 2>/dev/null && echo "✓ tunnel up" || { echo "✗ tunnel not listening"; exit 1; }
fi

exec node scripts/stripe-checkout.mjs

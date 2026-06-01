# Bitsmiths Payments

A self-hosted payment portal for Bitsmiths clients. Generates permanent, branded payment links that redirect clients to a Stripe Checkout session on demand — solving Stripe's 24-hour checkout session expiry limitation.

**Live URL:** https://payments.bitsmiths.studio  
**Deployed on:** Hetzner Coolify server (`188.245.219.95`)  
**Repo:** `bitsmiths-llc/bitsmiths-payments`

---

## How it works

```
CLI generates link
        ↓
payments.bitsmiths.studio/pay/[jwt-token]   ← permanent, shareable
        ↓  (client clicks — any time, days later)
Route handler verifies JWT signature
        ↓
Fresh Stripe Checkout Session created
        ↓
Client redirected to Stripe to pay
        ↓
Success → /thank-you?name=ClientName
Abandon → /payment-failed
```

The JWT token encodes `{ customerId, customerName, amount, description }` signed with a shared secret (`PAYMENT_SECRET`). No database needed. The link never expires — a new Stripe session is created each time the client visits.

This avoids:
- **Stripe Checkout Session 24h expiry** — session is created on demand when the client clicks, not when you generate the link
- **Stripe Billing/Invoice fee (0.7%)** — we use raw Checkout Sessions with inline `price_data`, not Stripe Invoices

---

## Generating a payment link (CLI)

```bash
pnpm checkout
```

Interactive flow:
1. Search existing Stripe customer or create new one
2. Enter invoice description (e.g. `FlyWithClass – June Retainer`)
3. Enter amount in USD (e.g. `2000` or `1941.70`)
4. Confirm → get permanent link

Example output:
```
✅  Payment link (permanent):

   https://payments.bitsmiths.studio/pay/eyJhbGciOiJIUzI1NiJ9.xxx.yyy
```

---

## Environment variables

Create `.env.local` in the project root:

```env
# Stripe secret key
# STRIPE_SECRET_KEY=sk_live_...   ← uncomment for production
STRIPE_SECRET_KEY=sk_test_...

# JWT signing secret — must match the deployed app's PAYMENT_SECRET
# Generate with: openssl rand -hex 32
PAYMENT_SECRET=<32+ char secret>

# Payments app base URL (used in JWT success/cancel redirects)
NEXT_PUBLIC_APP_URL=https://payments.bitsmiths.studio
PAYMENTS_APP_URL=https://payments.bitsmiths.studio
```

> **Important:** `PAYMENT_SECRET` must be identical in `.env.local` (for the CLI) and in the deployed container (for the route handler). If they differ, links will return invalid token errors.

---

## Project structure

```
src/
  app/
    pay/[token]/route.ts     ← JWT verify → Stripe session → redirect
    thank-you/page.tsx       ← Success page (shows client name)
    payment-failed/page.tsx  ← Failure/abandon page
    page.tsx                 ← Redirects to bitsmiths.studio
  lib/
    payment-token.ts         ← JWT sign/verify helpers
scripts/
  stripe-checkout.mjs        ← CLI for generating payment links
```

---

## Deployment

The app runs on the Hetzner Coolify server, deployed via Docker.

### Re-deploy after changes

```bash
# On the server
ssh hetzner-coolify
cd /opt/bitsmiths-payments
git pull origin main
docker build \
  --build-arg STRIPE_SECRET_KEY='sk_live_...' \
  --build-arg PAYMENT_SECRET='<secret>' \
  --build-arg NEXT_PUBLIC_APP_URL='https://payments.bitsmiths.studio' \
  -t bitsmiths-payments:latest .
docker stop bitsmiths-payments && docker rm bitsmiths-payments
docker run -d \
  --name bitsmiths-payments \
  --restart unless-stopped \
  --network coolify \
  -e STRIPE_SECRET_KEY='sk_live_...' \
  -e PAYMENT_SECRET='<secret>' \
  -e NEXT_PUBLIC_APP_URL='https://payments.bitsmiths.studio' \
  -l 'traefik.enable=true' \
  -l 'traefik.http.routers.bitsmiths-payments.rule=Host(`payments.bitsmiths.studio`)' \
  -l 'traefik.http.routers.bitsmiths-payments.entrypoints=https' \
  -l 'traefik.http.routers.bitsmiths-payments.tls=true' \
  -l 'traefik.http.routers.bitsmiths-payments.tls.certresolver=letsencrypt' \
  -l 'traefik.http.services.bitsmiths-payments.loadbalancer.server.port=3000' \
  bitsmiths-payments:latest
```

### DNS

Point `payments.bitsmiths.studio` → `188.245.219.95` (A record or CNAME).  
Traefik handles SSL automatically via Let's Encrypt once DNS resolves.

---

## Switching to production (live Stripe key)

1. In `.env.local`, comment out the test key and uncomment the live key
2. Rebuild and restart the container using the live key as the `STRIPE_SECRET_KEY` build arg

The `PAYMENT_SECRET` does not change between test and live — existing links remain valid.

---

## Test cards (Stripe test mode)

| Scenario | Card number | Expiry | CVC |
|---|---|---|---|
| Success | `4242 4242 4242 4242` | `12/34` | `123` |
| Generic decline | `4000 0000 0000 0002` | `12/34` | `123` |
| Insufficient funds | `4000 0000 0000 9995` | `12/34` | `123` |

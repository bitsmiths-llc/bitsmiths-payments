#!/usr/bin/env node
import { confirm,input, select } from "@inquirer/prompts";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
import { dirname,resolve } from "path";
import postgres from "postgres";
import Stripe from "stripe";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error("❌  STRIPE_SECRET_KEY not found in .env.local"); process.exit(1); }

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌  DATABASE_URL not found in .env.local");
  process.exit(1);
}

const appUrl = process.env.PAYMENTS_APP_URL ?? "https://payments.bitsmiths.studio";

const stripe = new Stripe(key);
const sql = postgres(databaseUrl, { max: 2 });
const isLive = key.startsWith("sk_live");

console.log(`\n💳  Bitsmiths Payment Link Generator  [${isLive ? "🟢 LIVE" : "🟡 TEST"}]\n`);

const SLUG_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function slugId(len = 12) {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  return s;
}

async function getAllCustomers() {
  const all = [];
  let page = await stripe.customers.list({ limit: 100 });
  all.push(...page.data);
  while (page.has_more) {
    page = await stripe.customers.list({ limit: 100, starting_after: all.at(-1).id });
    all.push(...page.data);
  }
  return all;
}

async function pickOrCreateCustomer() {
  const action = await select({
    message: "Customer",
    choices: [
      { name: "Search existing", value: "search" },
      { name: "Create new",      value: "create" },
    ],
  });

  if (action === "create") return createCustomer();

  const query = await input({ message: "Name or email (leave blank to list all):" });
  const all = await getAllCustomers();

  const matches = query.trim()
    ? all.filter((c) =>
        c.name?.toLowerCase().includes(query.toLowerCase()) ||
        c.email?.toLowerCase().includes(query.toLowerCase())
      )
    : all;

  if (matches.length === 0) {
    console.log("  No customers found.\n");
    return createCustomer();
  }

  const choices = [
    ...matches.slice(0, 20).map((c) => ({
      name: `${c.name ?? "(no name)"}  ${c.email ? `– ${c.email}` : ""}`,
      value: c,
    })),
    { name: "+ Create new customer", value: "new" },
  ];

  const selected = await select({ message: "Select customer:", choices });
  return selected === "new" ? createCustomer() : selected;
}

async function createCustomer() {
  const name  = await input({ message: "Name:",            validate: (v) => v.trim() ? true : "Required" });
  const email = await input({ message: "Email (optional):" });
  const customer = await stripe.customers.create({
    name: name.trim(),
    email: email.trim() || undefined,
  });
  console.log(`  ✓ Created customer: ${customer.name}\n`);
  return customer;
}

async function collectLineItems() {
  const items = [];

  while (true) {
    const name = await input({
      message: `Line item ${items.length + 1} — name:`,
      validate: (v) => v.trim() ? true : "Required",
    });

    const description = await input({
      message: `Line item ${items.length + 1} — description (optional):`,
    });

    const amountStr = await input({
      message: `Line item ${items.length + 1} — amount (USD):`,
      validate: (v) => {
        const n = parseFloat(v);
        return (!isNaN(n) && n > 0) ? true : "Enter a valid amount e.g. 1500 or 49.99";
      },
    });

    items.push({
      name: name.trim(),
      description: description.trim() || undefined,
      amount: Math.round(parseFloat(amountStr) * 100),
    });

    const addMore = await confirm({ message: "Add another line item?" });
    if (!addMore) break;
  }

  return items;
}

async function askExpiry() {
  const daysStr = await input({
    message: "Expire link after how many days? (blank = never):",
    validate: (v) => {
      if (!v.trim()) return true;
      const n = Number(v);
      return Number.isInteger(n) && n > 0 ? true : "Enter a whole number of days, or leave blank";
    },
  });
  if (!daysStr.trim()) return null;
  const ms = Number(daysStr) * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

async function insertPaymentLink(row) {
  // Retry a couple of times in the (very unlikely) event of a slug collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = slugId();
    try {
      const [created] = await sql`
        insert into payment_links
          (slug, customer_id, customer_name, customer_email,
           line_items, currency, status, expires_at)
        values
          (${slug}, ${row.customer_id}, ${row.customer_name}, ${row.customer_email},
           ${sql.json(row.line_items)}, ${row.currency}, ${row.status}, ${row.expires_at})
        returning slug
      `;
      return created.slug;
    } catch (err) {
      // 23505 = unique_violation (slug collision) → try a fresh slug.
      if (err.code !== "23505") throw new Error(err.message);
    }
  }
  throw new Error("Could not generate a unique slug after several attempts");
}

async function main() {
  const customer = await pickOrCreateCustomer();
  console.log(`\n  Customer: ${customer.name}\n`);

  const items = await collectLineItems();
  const expiresAt = await askExpiry();

  const total = items.reduce((s, i) => s + i.amount, 0);
  console.log("\n  Summary:");
  items.forEach((i) =>
    console.log(
      `    • ${i.name}${i.description ? ` — ${i.description}` : ""}: $${(i.amount / 100).toFixed(2)}`,
    ),
  );
  console.log(`    ─────────────────────────────`);
  console.log(`    Total: $${(total / 100).toFixed(2)}`);
  console.log(`    Expires: ${expiresAt ? new Date(expiresAt).toLocaleString() : "never"}\n`);

  const ok = await confirm({
    message: `Create payment link for ${customer.name}?`,
  });
  if (!ok) { console.log("\n  Cancelled.\n"); process.exit(0); }

  const slug = await insertPaymentLink({
    customer_id: customer.id,
    customer_name: customer.name,
    customer_email: customer.email ?? null,
    line_items: items,
    currency: "usd",
    status: "active",
    expires_at: expiresAt,
  });

  const url = `${appUrl}/pay/${slug}`;
  console.log(`\n✅  Payment link:\n\n   ${url}\n`);
}

main()
  .then(() => sql.end({ timeout: 5 }))
  .catch(async (err) => {
    console.error(`\n❌  ${err.message}\n`);
    await sql.end({ timeout: 5 }).catch(() => {});
    process.exit(1);
  });

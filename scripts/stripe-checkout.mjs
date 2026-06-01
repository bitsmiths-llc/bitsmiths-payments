#!/usr/bin/env node
import { input, select, confirm } from "@inquirer/prompts";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error("❌  STRIPE_SECRET_KEY not found in .env.local"); process.exit(1); }

const secret = process.env.PAYMENT_SECRET;
if (!secret) { console.error("❌  PAYMENT_SECRET not found in .env.local"); process.exit(1); }

const appUrl = process.env.PAYMENTS_APP_URL ?? "https://payments.bitsmiths.studio";

const stripe = new Stripe(key);
const isLive = key.startsWith("sk_live");

console.log(`\n💳  Bitsmiths Payment Link Generator  [${isLive ? "🟢 LIVE" : "🟡 TEST"}]\n`);

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

async function main() {
  const customer = await pickOrCreateCustomer();
  console.log(`\n  Customer: ${customer.name}\n`);

  const description = await input({
    message: "Invoice description:",
    validate: (v) => v.trim() ? true : "Required",
  });

  const amountStr = await input({
    message: "Amount (USD):",
    validate: (v) => {
      const n = parseFloat(v);
      return (!isNaN(n) && n > 0) ? true : "Enter a valid amount e.g. 1500 or 1941.70";
    },
  });

  const amount = Math.round(parseFloat(amountStr) * 100);

  const ok = await confirm({
    message: `Create $${(amount / 100).toFixed(2)} payment link for ${customer.name}?`,
  });
  if (!ok) { console.log("\n  Cancelled.\n"); process.exit(0); }

  const token = jwt.sign(
    {
      customerId:   customer.id,
      customerName: customer.name,
      amount,
      description:  description.trim(),
    },
    secret,
    // no expiry — link is permanent
  );

  const url = `${appUrl}/pay/${token}`;
  console.log(`\n✅  Payment link (permanent):\n\n   ${url}\n`);
}

main().catch((err) => {
  console.error(`\n❌  ${err.message}\n`);
  process.exit(1);
});

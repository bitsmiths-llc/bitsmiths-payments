import 'server-only';

import { db } from './db';

export type PaymentLineItem = {
  name: string;
  description?: string;
  amount: number; // in cents
};

export type PaymentLinkStatus = 'active' | 'paid' | 'revoked';

export type PaymentLinkRow = {
  id: string;
  slug: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  line_items: PaymentLineItem[];
  currency: string;
  status: PaymentLinkStatus;
  expires_at: string | null;
  stripe_session_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LinkState = 'ok' | 'not_found' | 'revoked' | 'expired' | 'paid';

export async function getPaymentLink(
  slug: string,
): Promise<PaymentLinkRow | null> {
  try {
    const sql = db();
    const rows = await sql<PaymentLinkRow[]>`
      select * from payment_links where slug = ${slug} limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export function linkState(link: PaymentLinkRow | null): LinkState {
  if (!link) return 'not_found';
  if (link.status === 'revoked') return 'revoked';
  if (link.status === 'paid') return 'paid';
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return 'expired';
  }
  return 'ok';
}

export async function markPaymentLinkPaid(
  slug: string,
  stripeSessionId: string,
): Promise<void> {
  const sql = db();
  await sql`
    update payment_links
       set status = 'paid',
           paid_at = now(),
           stripe_session_id = ${stripeSessionId}
     where slug = ${slug}
       and status <> 'revoked'
  `;
}

export function totalAmount(link: PaymentLinkRow): number {
  return link.line_items.reduce((sum, item) => sum + item.amount, 0);
}

export function formatAmount(cents: number, currency = 'usd'): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

export function lineItemLabel(link: PaymentLinkRow): string {
  return link.line_items.map((item) => item.name ?? item.description).join(', ');
}

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { markPaymentLinkPaid } from '@/lib/payment-links';

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  const stripe = new Stripe(stripeKey);
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const slug = session.metadata?.slug;
    if (slug) {
      await markPaymentLinkPaid(slug, session.id);
    }
  }

  return NextResponse.json({ received: true });
}

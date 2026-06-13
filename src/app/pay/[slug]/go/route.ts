import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { getPaymentLink, linkState } from '@/lib/payment-links';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${appUrl}/payment-failed?reason=${reason}`);

  const link = await getPaymentLink(slug);
  const state = linkState(link);
  if (state !== 'ok' || !link) return fail(state);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return fail('config');

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      customer: link.customer_id,
      mode: 'payment',
      line_items: link.line_items.map((item) => ({
        price_data: {
          currency: link.currency,
          product_data: {
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
          },
          unit_amount: item.amount,
        },
        quantity: 1,
      })),
      success_url: `${appUrl}/thank-you?name=${encodeURIComponent(link.customer_name)}`,
      cancel_url: `${appUrl}/payment-failed?reason=cancelled`,
      // Lets the Stripe webhook mark this link paid (single-use enforcement).
      metadata: { slug: link.slug, payment_link_id: link.id },
    });

    return NextResponse.redirect(session.url!);
  } catch {
    return fail('stripe');
  }
}

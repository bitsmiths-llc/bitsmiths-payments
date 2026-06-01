import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { verifyPaymentToken } from '@/lib/payment-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const failedUrl = `${appUrl}/payment-failed`;

  const secret = process.env.PAYMENT_SECRET;
  if (!secret) return NextResponse.redirect(failedUrl);

  const payload = verifyPaymentToken(token, secret);
  if (!payload) return NextResponse.redirect(failedUrl);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.redirect(failedUrl);

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      customer: payload.customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: payload.description },
            unit_amount: payload.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/thank-you?name=${encodeURIComponent(payload.customerName)}`,
      cancel_url: `${appUrl}/payment-failed`,
    });

    return NextResponse.redirect(session.url!);
  } catch {
    return NextResponse.redirect(failedUrl);
  }
}

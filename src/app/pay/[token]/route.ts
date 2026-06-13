import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { verifyPaymentToken, type PaymentPayload } from '@/lib/payment-token';

// Link-preview / social unfurl crawlers. These get a branded OG card instead of
// a Stripe redirect, so previews never leak the failed page and we don't create
// an abandoned checkout session on every unfurl.
const CRAWLER_UA =
  /whatsapp|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|linkedinbot|telegrambot|discordbot|applebot|skypeuripreview|pinterest|redditbot|embedly|iframely|vkshare|googlebot|bingbot/i;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function previewHtml(
  payload: PaymentPayload,
  appUrl: string,
  token: string,
): string {
  const total = payload.items.reduce((sum, item) => sum + item.amount, 0);
  const amount = (total / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const items = payload.items
    .map((item) => item.name ?? item.description)
    .join(', ');

  const title = escapeHtml(`Pay ${amount} · Bitsmiths`);
  const description = escapeHtml(
    `${items}. Secure checkout powered by Stripe.`,
  );
  const image = escapeHtml(`${appUrl}/pay/${token}/preview`);
  const url = escapeHtml(`${appUrl}/pay/${token}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Bitsmiths" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
</head>
<body style="margin:0;background:#000;color:#fff;font-family:sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<a href="${url}" style="color:#04CD77;text-decoration:none;font-size:18px">Continue to secure checkout →</a>
</body>
</html>`;
}

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

  // Serve a branded preview card to unfurl crawlers; real users fall through to
  // the Stripe redirect below.
  const ua = request.headers.get('user-agent') ?? '';
  if (CRAWLER_UA.test(ua)) {
    return new NextResponse(previewHtml(payload, appUrl, token), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.redirect(failedUrl);

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      customer: payload.customerId,
      mode: 'payment',
      line_items: payload.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            // Legacy tokens stored the label in `description`; new ones use `name`.
            name: item.name ?? item.description!,
            ...(item.name && item.description
              ? { description: item.description }
              : {}),
          },
          unit_amount: item.amount,
        },
        quantity: 1,
      })),
      success_url: `${appUrl}/thank-you?name=${encodeURIComponent(payload.customerName)}`,
      cancel_url: `${appUrl}/payment-failed`,
    });

    return NextResponse.redirect(session.url!);
  } catch {
    return NextResponse.redirect(failedUrl);
  }
}

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

import {
  formatAmount,
  getPaymentLink,
  lineItemLabel,
  totalAmount,
} from '@/lib/payment-links';

export const runtime = 'nodejs';

const BRAND = '#04CD77';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const link = await getPaymentLink(slug);

  const amount = link ? formatAmount(totalAmount(link), link.currency) : '';
  const rawLabel = link ? lineItemLabel(link) : 'Secure payment';
  const itemLabel =
    rawLabel.length > 90 ? `${rawLabel.slice(0, 87)}…` : rawLabel;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#000000',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '9999px',
              background: BRAND,
            }}
          />
          <div
            style={{
              color: '#ffffff',
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '6px',
            }}
          >
            BITSMITHS
          </div>
        </div>

        {/* Amount block */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              color: BRAND,
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '4px',
            }}
          >
            PAYMENT REQUEST
          </div>
          <div
            style={{
              color: '#ffffff',
              fontSize: '120px',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {amount}
          </div>
          <div style={{ display: 'flex', color: '#B3B3B3', fontSize: '34px' }}>
            {itemLabel}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', color: '#8a8a8a', fontSize: '24px' }}>
          Secure checkout · Powered by Stripe
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

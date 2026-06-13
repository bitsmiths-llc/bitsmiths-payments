import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import {
  formatAmount,
  getPaymentLink,
  lineItemLabel,
  linkState,
  totalAmount,
} from '@/lib/payment-links';

import { CheckoutRedirect } from './checkout-redirect';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getPaymentLink(slug);

  if (!link) {
    return { title: 'Payment link · Bitsmiths', robots: { index: false } };
  }

  const amount = formatAmount(totalAmount(link), link.currency);
  const title = `Pay ${amount} · Bitsmiths`;
  const description = `${lineItemLabel(link)}. Secure checkout powered by Stripe.`;
  const image = `/pay/${slug}/preview`;

  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      type: 'website',
      siteName: 'Bitsmiths',
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function PayPage({ params }: Props) {
  const { slug } = await params;
  const link = await getPaymentLink(slug);
  const state = linkState(link);

  // Anything that isn't a clean, payable link goes to the failed page with a
  // reason so the copy can be specific.
  if (state !== 'ok' || !link) {
    redirect(`/payment-failed?reason=${state}`);
  }

  const amount = formatAmount(totalAmount(link), link.currency);
  const goHref = `/pay/${slug}/go`;

  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white'>
      {/* Browsers run this and are sent to Stripe; crawlers ignore it and read
          the OG metadata above. */}
      <CheckoutRedirect href={goHref} />

      <div className='flex w-full max-w-md flex-col items-center gap-8 text-center'>
        <a href='https://bitsmiths.studio' aria-label='Bitsmiths home'>
          <img
            src='/svg/logos/bitsmiths-logo.svg'
            alt='Bitsmiths'
            className='h-[22px] w-[158px] opacity-80'
          />
        </a>

        <div className='flex flex-col items-center gap-5'>
          <div className='relative flex items-center justify-center'>
            <div className='absolute h-20 w-20 rounded-full bg-brand-500 opacity-10 blur-2xl' />
            <div className='h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-500' />
          </div>

          <div className='flex flex-col gap-2'>
            <p className='font-primary text-xs font-semibold uppercase tracking-widest text-neutral-b3'>
              Payment request · {amount}
            </p>
            <h1 className='font-clash text-3xl font-semibold leading-tight'>
              Taking you to secure checkout…
            </h1>
          </div>
        </div>

        <a
          href={goHref}
          className='font-primary text-sm text-neutral-b3 underline-offset-4 transition-colors hover:text-white hover:underline'
        >
          Not redirected? Continue to checkout →
        </a>
      </div>
    </main>
  );
}

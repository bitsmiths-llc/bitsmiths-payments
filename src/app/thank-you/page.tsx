import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

type Props = {
  searchParams: Promise<{ name?: string }>;
};

export const metadata = {
  title: 'Thank You | Bitsmiths',
  robots: { index: false },
};

export default async function ThankYouPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const displayName = name ? decodeURIComponent(name) : null;

  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white'>
      <div className='flex w-full max-w-md flex-col items-center gap-8 text-center'>
        <Link href='https://bitsmiths.studio' aria-label='Bitsmiths home'>
          <img
            src='/svg/logos/bitsmiths-logo.svg'
            alt='Bitsmiths'
            className='h-[22px] w-[158px] opacity-80'
          />
        </Link>

        <div className='flex flex-col items-center gap-6'>
          <CheckCircle className='text-brand-500' size={64} strokeWidth={1.5} />

          <div className='flex flex-col gap-3'>
            <h1 className='font-clash text-4xl font-semibold leading-tight'>
              {displayName ? (
                <>
                  Thank you,{' '}
                  <span className='whitespace-nowrap text-brand-500'>
                    {displayName}!
                  </span>
                </>
              ) : (
                'Thank you!'
              )}
            </h1>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              Your payment has been received.
            </p>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              It&apos;s been a pleasure working with you.
            </p>
          </div>
        </div>

        <a
          href='https://bitsmiths.studio'
          className='font-primary text-sm text-neutral-b3 underline-offset-4 transition-colors hover:text-white hover:underline'
        >
          ← Back to bitsmiths.studio
        </a>
      </div>
    </main>
  );
}

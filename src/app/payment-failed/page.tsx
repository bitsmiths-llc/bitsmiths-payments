import { XCircle } from 'lucide-react';

export const metadata = {
  title: 'Payment Failed | Bitsmiths',
  robots: { index: false },
};

export default function PaymentFailedPage() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-black px-6 text-white'>
      <div className='flex w-full max-w-md flex-col items-center gap-8 text-center'>
        <a href='https://bitsmiths.studio' aria-label='Bitsmiths home'>
          <img
            src='/svg/logos/bitsmiths-logo.svg'
            alt='Bitsmiths'
            className='h-[22px] w-[158px] opacity-80'
          />
        </a>

        <div className='flex flex-col items-center gap-6'>
          <XCircle className='text-red-500' size={64} strokeWidth={1.5} />

          <div className='flex flex-col gap-3'>
            <h1 className='font-clash text-4xl font-semibold leading-tight'>
              Payment unsuccessful
            </h1>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              Something went wrong and your payment could not be processed.
            </p>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              Please try again or{' '}
              <a
                href='mailto:ali@bitsmiths.studio'
                className='text-white underline underline-offset-4 transition-opacity hover:opacity-70'
              >
                reach out to us
              </a>{' '}
              and we&apos;ll sort it out.
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

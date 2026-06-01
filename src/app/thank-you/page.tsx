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
      <div className='flex w-full max-w-lg flex-col items-center gap-10 text-center'>

        {/* Logo */}
        <a href='https://bitsmiths.studio' aria-label='Bitsmiths home'>
          <img
            src='/svg/logos/bitsmiths-logo.svg'
            alt='Bitsmiths'
            className='h-[20px] w-auto opacity-60'
          />
        </a>

        {/* Icon with glow */}
        <div className='relative flex items-center justify-center'>
          <div className='absolute h-28 w-28 rounded-full bg-brand-500 opacity-10 blur-2xl' />
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.25'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='relative h-16 w-16 text-brand-500'
          >
            <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
            <polyline points='22 4 12 14.01 9 11.01' />
          </svg>
        </div>

        {/* Message */}
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            <p className='font-primary text-xs font-semibold uppercase tracking-widest text-neutral-b3'>
              Payment received
            </p>
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
          </div>

          <div className='mx-auto h-px w-12 bg-white/10' />

          <div className='flex flex-col gap-2'>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              It&apos;s genuinely been a pleasure working with you.
            </p>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              Looking forward to what we build together.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='flex flex-col items-center gap-2'>
          <a
            href='https://bitsmiths.studio'
            className='font-primary text-sm text-neutral-b3 underline-offset-4 transition-colors hover:text-white hover:underline'
          >
            bitsmiths.studio
          </a>
        </div>

      </div>
    </main>
  );
}

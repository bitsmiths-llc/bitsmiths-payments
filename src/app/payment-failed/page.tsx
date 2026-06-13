import { Ban, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const metadata = {
  title: 'Payment Failed | Bitsmiths',
  robots: { index: false },
};

type Props = {
  searchParams: Promise<{ reason?: string }>;
};

const COPY: Record<
  string,
  { icon: 'x' | 'clock' | 'ban' | 'check'; title: string; body: string }
> = {
  not_found: {
    icon: 'x',
    title: 'Link not found',
    body: "This payment link doesn't exist or has been removed.",
  },
  revoked: {
    icon: 'ban',
    title: 'Link disabled',
    body: 'This payment link has been disabled and can no longer be used.',
  },
  expired: {
    icon: 'clock',
    title: 'Link expired',
    body: 'This payment link has expired. Reach out and we’ll send a fresh one.',
  },
  paid: {
    icon: 'check',
    title: 'Already paid',
    body: 'This payment link has already been paid — nothing more to do here.',
  },
  cancelled: {
    icon: 'x',
    title: 'Checkout cancelled',
    body: 'Your checkout was cancelled and you have not been charged.',
  },
};

const FALLBACK = {
  icon: 'x' as const,
  title: 'Payment unsuccessful',
  body: 'Something went wrong and your payment could not be processed.',
};

function Icon({ kind }: { kind: 'x' | 'clock' | 'ban' | 'check' }) {
  const size = 64;
  const stroke = 1.5;
  if (kind === 'clock')
    return <Clock className='text-amber-400' size={size} strokeWidth={stroke} />;
  if (kind === 'ban')
    return <Ban className='text-red-500' size={size} strokeWidth={stroke} />;
  if (kind === 'check')
    return (
      <CheckCircle2
        className='text-brand-500'
        size={size}
        strokeWidth={stroke}
      />
    );
  return <XCircle className='text-red-500' size={size} strokeWidth={stroke} />;
}

export default async function PaymentFailedPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  const copy = (reason && COPY[reason]) || FALLBACK;

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
          <Icon kind={copy.icon} />

          <div className='flex flex-col gap-3'>
            <h1 className='font-clash text-4xl font-semibold leading-tight'>
              {copy.title}
            </h1>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              {copy.body}
            </p>
            <p className='font-primary text-base leading-relaxed text-neutral-b3'>
              Need a hand?{' '}
              <a
                href='mailto:ali@bitsmiths.studio'
                className='text-white underline underline-offset-4 transition-opacity hover:opacity-70'
              >
                Reach out to us
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

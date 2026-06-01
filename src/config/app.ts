import { Metadata } from 'next';

import { env } from '@/env';

export const appConfig = {
  title: 'Bitsmiths Payments',
  description: 'Secure payment portal for Bitsmiths clients.',
  appUrl: env.NEXT_PUBLIC_APP_URL,
} as const;

export default function getMetadata(): Metadata {
  return {
    metadataBase: new URL(appConfig.appUrl),
    title: appConfig.title,
    description: appConfig.description,
    robots: { index: false, follow: false },
  };
}

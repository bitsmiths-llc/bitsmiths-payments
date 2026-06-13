import type { Metadata } from 'next';
import { Mulish } from 'next/font/google';
import localFont from 'next/font/local';

import './globals.css';

import AppProviders from './providers';

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-mulish',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const clashGrotesk = localFont({
  src: '../../public/fonts/ClashGrotesk-Semibold.ttf',
  variable: '--font-clash-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://payments.bitsmiths.studio',
  ),
  title: 'Bitsmiths Payments',
  description: 'Secure payment portal for Bitsmiths clients.',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  appleWebApp: { title: 'Bitsmiths' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${mulish.variable} ${clashGrotesk.variable} bg-black`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

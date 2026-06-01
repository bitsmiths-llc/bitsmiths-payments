import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Mulish } from 'next/font/google';

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
  title: 'Bitsmiths Payments',
  description: 'Secure payment portal for Bitsmiths clients.',
  robots: { index: false, follow: false },
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

import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/components/Providers';
import { SiteHeader } from '@/components/SiteHeader';
import { brand } from '@/theme/theme';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Casita Stays — boutique homes worth the trip', template: '%s · Casita Stays' },
  description:
    'Find and book characterful casitas, lofts and villas in Lisbon, Barcelona, Mexico City, Tulum, Kyoto, Cape Town and Buenos Aires.',
};

export const viewport: Viewport = {
  themeColor: brand.sand,
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

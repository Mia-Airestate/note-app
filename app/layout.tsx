import './globals.css';
import { UIProvider } from '@/components/providers/UIProvider';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'New Page',
  description: 'Block-based note editor',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'New Page',
  },
  icons: {
    icon: [
      { url: '/icon512_rounded.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon512_rounded.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="New Page" />
      </head>
      <body>
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}


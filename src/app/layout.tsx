import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const appUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || 'https://castalchemy.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'CastAlchemy - Alchemix on Farcaster',
  description: 'Self-repaying loans via Frames, Cast Actions, and bots',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${appUrl}/frame-cover.svg`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Open Mini App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': `${appUrl}/miniapp`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

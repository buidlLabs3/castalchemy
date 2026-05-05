import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://castalchemy.vercel.app');

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: `${appUrl}/frame-cover.svg`,
  button: {
    title: 'Open CastAlchemy',
    action: {
      type: 'launch_miniapp',
      name: 'CastAlchemy',
      url: `${appUrl}/miniapp`,
      splashImageUrl: `${appUrl}/frame-cover.svg`,
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

const legacyFrameEmbed = JSON.stringify({
  version: '1',
  imageUrl: `${appUrl}/frame-cover.svg`,
  button: {
    title: 'Open CastAlchemy',
    action: {
      type: 'launch_frame',
      name: 'CastAlchemy',
      url: `${appUrl}/miniapp`,
      splashImageUrl: `${appUrl}/frame-cover.svg`,
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'CastAlchemy - Alchemix on Farcaster',
  description: 'Self-repaying loans via Frames, Cast Actions, and bots',
  other: {
    'fc:miniapp': miniAppEmbed,
    // Legacy fallback for clients that still read fc:frame tags.
    'fc:frame': legacyFrameEmbed,
    'fc:frame:image': `${appUrl}/frame-cover.svg`,
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Open CastAlchemy',
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

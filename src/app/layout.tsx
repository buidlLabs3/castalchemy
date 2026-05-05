import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { getPublicAppUrl } from '@/lib/config/app';

const appUrl = getPublicAppUrl();
const embedImageUrl = `${appUrl}/api/miniapp-image`;
const splashImageUrl = `${appUrl}/api/miniapp-splash`;

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: embedImageUrl,
  button: {
    title: 'Open CastAlchemy',
    action: {
      type: 'launch_miniapp',
      name: 'CastAlchemy',
      url: `${appUrl}/miniapp`,
      splashImageUrl,
      splashBackgroundColor: '#0a0a0a',
    },
  },
});

const legacyFrameEmbed = JSON.stringify({
  version: '1',
  imageUrl: embedImageUrl,
  button: {
    title: 'Open CastAlchemy',
    action: {
      type: 'launch_frame',
      name: 'CastAlchemy',
      url: `${appUrl}/miniapp`,
      splashImageUrl,
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

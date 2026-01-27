import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CastAlchemy - Alchemix on Farcaster',
  description: 'Self-repaying loans via Frames, Cast Actions, and bots',
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=CastAlchemy',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Open Frame',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://castalchemy.vercel.app/api/frames',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


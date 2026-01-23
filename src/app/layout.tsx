import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CastAlchemy - Alchemix on Farcaster',
  description: 'Self-repaying loans via Frames, Cast Actions, and bots',
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


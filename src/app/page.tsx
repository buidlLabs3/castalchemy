/**
 * Main landing page with Frame metadata
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CastAlchemy - Alchemix on Farcaster',
  description: 'Self-repaying loans via Frames',
  openGraph: {
    title: 'CastAlchemy',
    description: 'Alchemix on Farcaster - Self-repaying loans',
    images: ['https://via.placeholder.com/600x400/1a1a1a/ffffff?text=CastAlchemy'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=CastAlchemy',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Open Frame',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://castalchemy.vercel.app/api/frames',
  },
};

export default function Home() {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ⚗️ CastAlchemy
      </h1>
      <p style={{ fontSize: '1.5rem', color: '#888', marginBottom: '2rem' }}>
        Alchemix on Farcaster
      </p>
      <p style={{ fontSize: '1rem', color: '#666', textAlign: 'center', maxWidth: '600px' }}>
        Self-repaying loans via Frames, Cast Actions, and bots. Connect your wallet and start
        depositing to Alchemix vaults directly from your Farcaster feed.
      </p>
    </main>
  );
}


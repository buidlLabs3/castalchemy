/**
 * Main landing page with Frame metadata and Mini App SDK
 */
'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Farcaster Mini App SDK
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        // Call ready() to hide splash screen
        await sdk.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize SDK:', error);
        setIsReady(true); // Show content anyway
      }
    }
    
    initSDK();
  }, []);

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
      <p style={{ fontSize: '1rem', color: '#666', textAlign: 'center', maxWidth: '600px', marginBottom: '2rem' }}>
        Self-repaying loans via Frames, Cast Actions, and bots. Connect your wallet and start
        depositing to Alchemix vaults directly from your Farcaster feed.
      </p>
      {isReady && (
        <a 
          href="/miniapp" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#4ade80',
            color: '#000',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            marginTop: '1rem',
          }}
        >
          Launch App
        </a>
      )}
    </main>
  );
}


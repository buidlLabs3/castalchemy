/**
 * Positions page for Mini App - WITH REAL DATA
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PositionsClient } from './client';

export default function PositionsPage() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize SDK:', error);
        setIsReady(true);
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
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          alignSelf: 'flex-start',
          padding: '0.5rem 1rem',
          backgroundColor: '#2a2a2a',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          marginBottom: '2rem',
        }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        📊 My Positions
      </h1>

      {isReady && <PositionsClient />}
    </main>
  );
}

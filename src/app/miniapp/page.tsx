/**
 * Mini App page - Full interactive experience
 */
'use client';

import { useEffect, useState } from 'react';

export default function MiniApp() {
  const [isReady, setIsReady] = useState(false);
  const [sdk, setSdk] = useState<any>(null);

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk: farcasterSdk } = await import('@farcaster/miniapp-sdk');
        await farcasterSdk.actions.ready();
        setSdk(farcasterSdk);
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
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        ⚗️ CastAlchemy
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#888', marginBottom: '2rem' }}>
        Alchemix on Farcaster
      </p>

      {isReady && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          width: '100%', 
          maxWidth: '400px' 
        }}>
          <a
            href="https://castalchemy.vercel.app/api/frames"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '1.5rem',
              backgroundColor: '#4ade80',
              color: '#000',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            💰 Deposit to Alchemix
          </a>

          <a
            href="https://castalchemy.vercel.app/api/frames/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '1.5rem',
              backgroundColor: '#60a5fa',
              color: '#000',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            📊 My Positions
          </a>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.5rem',
            fontSize: '0.9rem',
            color: '#888',
            textAlign: 'center',
          }}>
            <p style={{ margin: 0 }}>
              Self-repaying loans powered by Alchemix V2
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem' }}>
              Deposit collateral, borrow alUSD/alETH, and watch your debt decrease over time from yield.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}


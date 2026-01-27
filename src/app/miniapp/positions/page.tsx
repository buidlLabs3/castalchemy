/**
 * Positions page for Mini App
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        📊 My Positions
      </h1>

      {isReady && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* alUSD Position */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.75rem',
            marginBottom: '1rem',
          }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#4ade80' }}>
              alUSD Vault
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Deposited:</span>
              <span style={{ fontWeight: 'bold' }}>$0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Borrowed:</span>
              <span style={{ fontWeight: 'bold' }}>$0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Health Factor:</span>
              <span style={{ fontWeight: 'bold', color: '#4ade80' }}>Healthy</span>
            </div>
          </div>

          {/* alETH Position */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#60a5fa' }}>
              alETH Vault
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Deposited:</span>
              <span style={{ fontWeight: 'bold' }}>0.000 ETH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Borrowed:</span>
              <span style={{ fontWeight: 'bold' }}>0.000 ETH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#888' }}>Health Factor:</span>
              <span style={{ fontWeight: 'bold', color: '#4ade80' }}>Healthy</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/miniapp/deposit')}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#4ade80',
              color: '#000',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Make a Deposit
          </button>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            color: '#888',
          }}>
            <p style={{ margin: 0, marginBottom: '0.5rem' }}>
              ℹ️ <strong>Connect Wallet</strong> to view your actual positions
            </p>
            <p style={{ margin: 0 }}>
              Showing placeholder data. Real positions will appear once wallet is connected.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}


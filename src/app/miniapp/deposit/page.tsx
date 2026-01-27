/**
 * Deposit page for Mini App
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DepositPage() {
  const [isReady, setIsReady] = useState(false);
  const [vault, setVault] = useState<'alUSD' | 'alETH' | null>(null);
  const [amount, setAmount] = useState('');
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
        💰 Deposit to Alchemix
      </h1>

      {isReady && !vault && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <button
            onClick={() => setVault('alUSD')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#4ade80',
              color: '#000',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            alUSD Vault (Stablecoins)
          </button>
          <button
            onClick={() => setVault('alETH')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#60a5fa',
              color: '#000',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            alETH Vault (ETH)
          </button>
        </div>
      )}

      {isReady && vault && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {vault} Vault
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {vault === 'alUSD' 
                ? 'Deposit DAI, USDC, or USDT to borrow alUSD' 
                : 'Deposit ETH to borrow alETH'}
            </p>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '2px solid #4a4a4a',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginBottom: '1rem',
              }}
            />
            <button
              onClick={() => alert(`Deposit ${amount} to ${vault} - Connect wallet to continue`)}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: parseFloat(amount) > 0 ? '#4ade80' : '#444',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: parseFloat(amount) > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              Deposit {amount || '0'} {vault === 'alUSD' ? 'USD' : 'ETH'}
            </button>
          </div>
          <button
            onClick={() => setVault(null)}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            Choose Different Vault
          </button>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#2a2a2a',
        borderRadius: '0.5rem',
        fontSize: '0.85rem',
        color: '#888',
        maxWidth: '400px',
      }}>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
          ⚠️ <strong>Note:</strong> Wallet connection coming soon!
        </p>
        <p style={{ margin: 0 }}>
          This will integrate with Farcaster wallet to execute real transactions on Alchemix V2 contracts.
        </p>
      </div>
    </main>
  );
}


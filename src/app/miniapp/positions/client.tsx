/**
 * Client component for positions page
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/hooks';
import { getPosition } from '@/lib/contracts/transactions';
import { WalletButton } from '@/components/WalletButton';
import type { Address } from 'viem';

interface Position {
  deposited: string;
  borrowed: string;
  healthFactor: string;
}

export function PositionsClient() {
  const [alUSDPosition, setAlUSDPosition] = useState<Position | null>(null);
  const [alETHPosition, setAlETHPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { address, isConnected } = useWallet();

  useEffect(() => {
    async function fetchPositions() {
      if (!address || !isConnected) return;

      setLoading(true);
      try {
        const [alUSD, alETH] = await Promise.all([
          getPosition('alUSD', address as Address),
          getPosition('alETH', address as Address),
        ]);
        
        setAlUSDPosition(alUSD);
        setAlETHPosition(alETH);
      } catch (error) {
        console.error('Failed to fetch positions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPositions();
  }, [address, isConnected]);

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <WalletButton />
      </div>

      {!isConnected && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#2a2a2a',
          borderRadius: '0.75rem',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <p style={{ margin: 0, color: '#888' }}>
            Connect your wallet to view your Alchemix positions
          </p>
        </div>
      )}

      {isConnected && loading && (
        <div style={{
          padding: '2rem',
          color: '#888',
          textAlign: 'center',
        }}>
          Loading positions...
        </div>
      )}

      {isConnected && !loading && (
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
            {alUSDPosition ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Deposited:</span>
                  <span style={{ fontWeight: 'bold' }}>${alUSDPosition.deposited}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Borrowed:</span>
                  <span style={{ fontWeight: 'bold' }}>${alUSDPosition.borrowed}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Health Factor:</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: alUSDPosition.healthFactor === 'Healthy' ? '#4ade80' : 
                           alUSDPosition.healthFactor === 'Warning' ? '#fbbf24' : '#ef4444'
                  }}>
                    {alUSDPosition.healthFactor}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>No position</p>
            )}
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
            {alETHPosition ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Deposited:</span>
                  <span style={{ fontWeight: 'bold' }}>{alETHPosition.deposited} ETH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Borrowed:</span>
                  <span style={{ fontWeight: 'bold' }}>{alETHPosition.borrowed} ETH</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#888' }}>Health Factor:</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: alETHPosition.healthFactor === 'Healthy' ? '#4ade80' : 
                           alETHPosition.healthFactor === 'Warning' ? '#fbbf24' : '#ef4444'
                  }}>
                    {alETHPosition.healthFactor}
                  </span>
                </div>
              </>
            ) : (
              <p style={{ color: '#888', margin: 0 }}>No position</p>
            )}
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
              marginBottom: '1rem',
            }}
          >
            Make a Deposit
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🔄 Refresh Positions
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
              ℹ️ <strong>Live Data</strong>
            </p>
            <p style={{ margin: 0 }}>
              Showing real positions from Alchemix V2 contracts on Ethereum mainnet.
            </p>
          </div>
        </div>
      )}
    </>
  );
}


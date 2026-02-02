/**
 * Wallet connection indicator for Farcaster
 * This is now just a display component - wallet auto-connects in Farcaster
 */
'use client';

import { useWallet } from '@/lib/wallet/hooks';

export function WalletButton() {
  const { address, isConnected, isConnecting } = useWallet();

  if (isConnecting) {
    return (
      <div style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#2a2a2a',
        color: '#fff',
        borderRadius: '0.75rem',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        textAlign: 'center',
      }}>
        🔐 Connecting...
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#ff4444',
        color: '#fff',
        borderRadius: '0.75rem',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        textAlign: 'center',
      }}>
        ⚠️ Not in Farcaster
      </div>
    );
  }

  return (
    <div style={{
      padding: '0.75rem 1.5rem',
      background: 'linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)',
      color: '#fff',
      borderRadius: '0.75rem',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    }}>
      <span>🎭</span>
      <span style={{ fontFamily: 'monospace' }}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
}

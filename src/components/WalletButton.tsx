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
        backgroundColor: 'var(--surface-raised)',
        color: 'var(--ink)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        textAlign: 'center',
      }}>
        Connecting...
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
        color: 'var(--danger)',
        border: '1px solid rgba(248, 113, 113, 0.2)',
        borderRadius: 8,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        textAlign: 'center',
      }}>
        Not connected
      </div>
    );
  }

  return (
    <div style={{
      padding: '0.75rem 1.5rem',
      background: 'var(--brand-muted)',
      color: 'var(--brand-strong)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      fontWeight: 'bold',
      fontSize: '0.9rem',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    }}>
      <span style={{ fontFamily: 'monospace' }}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
}

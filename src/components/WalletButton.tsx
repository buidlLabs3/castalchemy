/**
 * Unified wallet connection button for Farcaster + WalletConnect
 */
'use client';

import { useWallet } from '@/lib/wallet/hooks';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletButton() {
  const { address, isConnected, isConnecting, isFarcaster, connect, disconnect } = useWallet();

  // If connected via Farcaster, show custom button
  if (isFarcaster && isConnected && address) {
    return (
      <button
        onClick={disconnect}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#4ade80',
          color: '#000',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '0.95rem',
        }}
      >
        🎭 {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  // If not in Farcaster, show RainbowKit button
  if (!isFarcaster) {
    return <ConnectButton />;
  }

  // Loading state
  if (isConnecting) {
    return (
      <button
        disabled
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#444',
          color: '#fff',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold',
          cursor: 'not-allowed',
        }}
      >
        Connecting...
      </button>
    );
  }

  // Not connected
  return (
    <button
      onClick={connect}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: '#4ade80',
        color: '#000',
        border: 'none',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        cursor: 'pointer',
      }}
    >
      Connect Wallet
    </button>
  );
}



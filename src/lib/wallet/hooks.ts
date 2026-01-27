/**
 * Custom hooks for hybrid wallet (Farcaster + WalletConnect)
 */
'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import type { Address } from 'viem';

interface WalletState {
  address: Address | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  isFarcaster: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Hybrid wallet hook - tries Farcaster first, falls back to WalletConnect
 */
export function useWallet(): WalletState {
  const [farcasterAddress, setFarcasterAddress] = useState<Address | undefined>();
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [isCheckingFarcaster, setIsCheckingFarcaster] = useState(true);

  // WalletConnect state
  const { address: wcAddress, isConnected: wcIsConnected } = useAccount();
  const { disconnect: wcDisconnect } = useDisconnect();
  const { connect, connectors, isPending } = useConnect();

  // Try to connect to Farcaster wallet on mount
  useEffect(() => {
    async function checkFarcasterWallet() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        // Check if we're in Farcaster context
        if (sdk.wallet?.ethProvider) {
          const accounts = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[];
          
          if (accounts && accounts.length > 0) {
            setFarcasterAddress(accounts[0] as Address);
            setIsFarcaster(true);
          }
        }
      } catch {
        console.log('Not in Farcaster context or wallet not available');
      } finally {
        setIsCheckingFarcaster(false);
      }
    }

    checkFarcasterWallet();
  }, []);

  const handleConnect = async () => {
    if (isFarcaster) {
      // Already connected via Farcaster
      return;
    }

    // Connect via WalletConnect (try MetaMask first)
    const metaMaskConnector = connectors.find((c) => c.id === 'injected');
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  const handleDisconnect = () => {
    if (isFarcaster) {
      setFarcasterAddress(undefined);
      setIsFarcaster(false);
    } else {
      wcDisconnect();
    }
  };

  return {
    address: isFarcaster ? farcasterAddress : wcAddress,
    isConnected: isFarcaster ? !!farcasterAddress : wcIsConnected,
    isConnecting: isCheckingFarcaster || isPending,
    isFarcaster,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };
}

/**
 * Get the Farcaster or WalletConnect provider for signing transactions
 */
export async function getWalletProvider(): Promise<{
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}> {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    if (sdk.wallet?.ethProvider) {
      return sdk.wallet.ethProvider;
    }
  } catch {
    // Not in Farcaster, use wagmi provider
  }
  
  // Return wagmi provider (for WalletConnect)
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    const ethereum = (window as { ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    }}).ethereum;
    if (ethereum) {
      return ethereum;
    }
  }
  
  throw new Error('No wallet provider available');
}



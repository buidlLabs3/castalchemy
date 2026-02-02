/**
 * Hybrid wallet hooks - Farcaster + WalletConnect with instant connection
 */
'use client';

import { useEffect, useState } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import type { Address } from 'viem';

type WalletMode = 'farcaster' | 'external' | null;

interface WalletState {
  address: Address | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  walletMode: WalletMode;
  isFarcasterAvailable: boolean;
  switchToExternal: () => void;
  switchToFarcaster: () => void;
  disconnect: () => void;
}

/**
 * Hybrid wallet hook with instant Farcaster detection
 */
export function useWallet(): WalletState {
  const [farcasterAddress, setFarcasterAddress] = useState<Address | undefined>();
  const [walletMode, setWalletMode] = useState<WalletMode>(null);
  const [isFarcasterAvailable, setIsFarcasterAvailable] = useState(false);
  const [isCheckingFarcaster, setIsCheckingFarcaster] = useState(true);

  // WalletConnect state
  const { address: wcAddress, isConnected: wcIsConnected } = useAccount();
  const { disconnect: wcDisconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  // Fast Farcaster wallet detection - runs immediately, auto-connects
  useEffect(() => {
    let mounted = true;
    
    async function detectFarcasterWallet() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        if (!mounted) return;
        
        if (sdk.wallet?.ethProvider) {
          setIsFarcasterAvailable(true);
          
          const accounts = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[];
          
          if (mounted && accounts && accounts.length > 0) {
            setFarcasterAddress(accounts[0] as Address);
            setWalletMode('farcaster');
          }
        }
      } catch (error) {
        console.log('Not in Farcaster context:', error);
      } finally {
        if (mounted) {
          setIsCheckingFarcaster(false);
        }
      }
    }

    detectFarcasterWallet();
    
    return () => {
      mounted = false;
    };
  }, []);

  const switchToExternal = () => {
    setWalletMode('external');
    const metaMaskConnector = connectors.find((c) => c.id === 'injected' || c.id === 'metaMask');
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  const switchToFarcaster = () => {
    if (farcasterAddress) {
      if (wcIsConnected) {
        wcDisconnect();
      }
      setWalletMode('farcaster');
    }
  };

  const handleDisconnect = () => {
    if (walletMode === 'external' && wcIsConnected) {
      wcDisconnect();
    }
    setWalletMode(null);
    setFarcasterAddress(undefined);
  };

  return {
    address: walletMode === 'farcaster' ? farcasterAddress : wcAddress,
    isConnected: walletMode === 'farcaster' ? !!farcasterAddress : wcIsConnected,
    isConnecting: isCheckingFarcaster,
    walletMode,
    isFarcasterAvailable,
    switchToExternal,
    switchToFarcaster,
    disconnect: handleDisconnect,
  };
}

/**
 * Get the appropriate wallet provider based on mode
 */
export async function getWalletProvider(mode: WalletMode = 'farcaster') {
  if (mode === 'farcaster') {
    try {
      const { sdk } = await import('@farcaster/miniapp-sdk');
      if (sdk.wallet?.ethProvider) {
        return sdk.wallet.ethProvider;
      }
    } catch (error) {
      console.error('Failed to get Farcaster provider:', error);
    }
  }
  
  // For external wallet
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

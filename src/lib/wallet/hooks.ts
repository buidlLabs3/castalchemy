/**
 * Hybrid wallet hooks - Farcaster + WalletConnect with manual switching
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
  switchToExternal: () => void;
  switchToFarcaster: () => void;
  disconnect: () => void;
}

/**
 * Hybrid wallet hook with manual switching between Farcaster and external wallets
 */
export function useWallet(): WalletState {
  const [farcasterAddress, setFarcasterAddress] = useState<Address | undefined>();
  const [walletMode, setWalletMode] = useState<WalletMode>(null);
  const [isCheckingFarcaster, setIsCheckingFarcaster] = useState(true);

  // WalletConnect state
  const { address: wcAddress, isConnected: wcIsConnected } = useAccount();
  const { disconnect: wcDisconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  // Auto-detect Farcaster wallet on mount
  useEffect(() => {
    async function detectFarcasterWallet() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        if (sdk.wallet?.ethProvider) {
          const accounts = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[];
          
          if (accounts && accounts.length > 0) {
            setFarcasterAddress(accounts[0] as Address);
            // Auto-select Farcaster if available
            if (!walletMode) {
              setWalletMode('farcaster');
            }
          }
        }
      } catch (error) {
        console.error('Failed to detect Farcaster wallet:', error);
      } finally {
        setIsCheckingFarcaster(false);
      }
    }

    detectFarcasterWallet();
  }, [walletMode]);

  const switchToExternal = () => {
    setWalletMode('external');
    // Try to connect via MetaMask/WalletConnect
    const metaMaskConnector = connectors.find((c) => c.id === 'injected' || c.id === 'metaMask');
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    }
  };

  const switchToFarcaster = () => {
    if (farcasterAddress) {
      // Disconnect external wallet if connected
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
  };

  return {
    address: walletMode === 'farcaster' ? farcasterAddress : wcAddress,
    isConnected: walletMode === 'farcaster' ? !!farcasterAddress : wcIsConnected,
    isConnecting: isCheckingFarcaster,
    walletMode,
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

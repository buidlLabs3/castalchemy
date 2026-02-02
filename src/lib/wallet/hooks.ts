/**
 * Farcaster wallet hooks - Farcaster native wallet only
 */
'use client';

import { useEffect, useState } from 'react';
import type { Address } from 'viem';

interface WalletState {
  address: Address | undefined;
  isConnected: boolean;
  isConnecting: boolean;
}

/**
 * Farcaster native wallet hook
 */
export function useWallet(): WalletState {
  const [address, setAddress] = useState<Address | undefined>();
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    async function connectFarcasterWallet() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        
        if (sdk.wallet?.ethProvider) {
          const accounts = await sdk.wallet.ethProvider.request({
            method: 'eth_requestAccounts',
          }) as string[];
          
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0] as Address);
          }
        }
      } catch (error) {
        console.error('Failed to connect Farcaster wallet:', error);
      } finally {
        setIsConnecting(false);
      }
    }

    connectFarcasterWallet();
  }, []);

  return {
    address,
    isConnected: !!address,
    isConnecting,
  };
}

/**
 * Get the Farcaster wallet provider for transactions
 */
export async function getFarcasterProvider() {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    if (sdk.wallet?.ethProvider) {
      return sdk.wallet.ethProvider;
    }
  } catch (error) {
    console.error('Failed to get Farcaster provider:', error);
  }
  
  throw new Error('Farcaster wallet not available. Please open in Farcaster app.');
}

/**
 * Wallet connection utilities
 * Supports Coinbase, Rainbow, MetaMask
 */

import type { WalletProvider } from '@/types';

export const SUPPORTED_WALLETS: WalletProvider[] = [
  {
    name: 'Coinbase Wallet',
    id: 'coinbase',
  },
  {
    name: 'Rainbow',
    id: 'rainbow',
  },
  {
    name: 'MetaMask',
    id: 'metamask',
  },
];

export function getWalletProviderName(providerId: string): string {
  const wallet = SUPPORTED_WALLETS.find((w) => w.id === providerId);
  return wallet?.name || 'Wallet';
}

export function validateAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}


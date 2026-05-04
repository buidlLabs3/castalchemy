/**
 * Network configuration
 * V3 contract addresses are managed in src/lib/v3/config.ts
 */

import type { Network } from '@/types';

export const SUPPORTED_NETWORKS: Record<Network, { chainId: number; rpcUrl: string }> = {
  ethereum: {
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  },
};

export const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.USE_TESTNET === 'true';

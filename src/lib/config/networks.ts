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
  base: {
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  },
  optimism: {
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  },
};

export const TESTNET_NETWORKS: Record<string, { chainId: number; rpcUrl: string }> = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  },
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  },
};

export const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.USE_TESTNET === 'true';

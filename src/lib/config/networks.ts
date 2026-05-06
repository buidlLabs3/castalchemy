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
};

export const IS_TESTNET = false;

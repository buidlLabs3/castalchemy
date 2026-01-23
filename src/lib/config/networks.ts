/**
 * Network and contract configuration
 * Using testnet addresses - update with production addresses when ready
 */

import type { Network, VaultConfig } from '@/types';

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
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
  },
  'base-sepolia': {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  },
};

// Alchemix V2 contract addresses (testnet - update with actual addresses)
export const ALCHEMIX_V2_VAULTS: Record<string, VaultConfig> = {
  alUSD: {
    address: process.env.ALUSD_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000', // TODO: Add actual address
    tokenAddress: process.env.ALUSD_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    network: 'ethereum',
    type: 'alUSD',
    chainId: SUPPORTED_NETWORKS.ethereum.chainId,
  },
  alETH: {
    address: process.env.ALETH_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000', // TODO: Add actual address
    tokenAddress: process.env.ALETH_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    network: 'ethereum',
    type: 'alETH',
    chainId: SUPPORTED_NETWORKS.ethereum.chainId,
  },
};

export const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.USE_TESTNET === 'true';


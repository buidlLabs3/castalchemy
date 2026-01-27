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

// Alchemix V2 contract addresses (Ethereum Mainnet)
// Source: https://github.com/alchemix-finance/deployments
export const ALCHEMIX_V2_VAULTS: Record<string, VaultConfig> = {
  alUSD: {
    address: process.env.ALUSD_VAULT_ADDRESS || '0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd', // AlchemistV2 alUSD
    tokenAddress: process.env.ALUSD_TOKEN_ADDRESS || '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9', // alUSD token
    network: 'ethereum',
    type: 'alUSD',
    chainId: SUPPORTED_NETWORKS.ethereum.chainId,
  },
  alETH: {
    address: process.env.ALETH_VAULT_ADDRESS || '0x062Bf725dC4cDF947aa79Ca2aaCCD4F385b13b5c', // AlchemistV2 alETH
    tokenAddress: process.env.ALETH_TOKEN_ADDRESS || '0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6', // alETH token
    network: 'ethereum',
    type: 'alETH',
    chainId: SUPPORTED_NETWORKS.ethereum.chainId,
  },
};

export const IS_TESTNET = process.env.NODE_ENV === 'development' || process.env.USE_TESTNET === 'true';


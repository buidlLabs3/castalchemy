/**
 * Core types for CastAlchemy
 */

export type Network = 'ethereum' | 'base' | 'optimism';

export type VaultType = 'alUSD' | 'alETH';

export interface VaultConfig {
  address: string;
  tokenAddress: string;
  network: Network;
  type: VaultType;
  chainId: number;
}

export interface Position {
  userAddress: string;
  vaultType: VaultType;
  deposited: string;
  borrowed: string;
  healthFactor: number;
  apy: number;
  lastUpdated: number;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface WalletProvider {
  name: string;
  id: string;
  icon?: string;
}


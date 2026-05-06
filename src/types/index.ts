/**
 * Core types for CastAlchemy
 */

export type Network = 'ethereum';

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

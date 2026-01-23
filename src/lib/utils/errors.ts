/**
 * Error handling utilities for user-friendly error messages
 */

export class CastAlchemyError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
  ) {
    super(message);
    this.name = 'CastAlchemyError';
  }
}

export const ERROR_CODES = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_COLLATERAL: 'INSUFFICIENT_COLLATERAL',
  HEALTH_FACTOR_TOO_LOW: 'HEALTH_FACTOR_TOO_LOW',
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONTRACT_ERROR: 'CONTRACT_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
} as const;

export function formatError(error: unknown): string {
  if (error instanceof CastAlchemyError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Handle common blockchain errors
    if (error.message.includes('user rejected')) {
      return 'Transaction was cancelled';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient balance for this transaction';
    }
    if (error.message.includes('execution reverted')) {
      return 'Transaction failed. Please check your position health.';
    }
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

export function isUserRejectedError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.toLowerCase().includes('user rejected') ||
           error.message.toLowerCase().includes('user denied');
  }
  return false;
}


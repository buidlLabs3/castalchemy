/**
 * Transaction helpers for Alchemix contracts
 * NOTE: Alchemix functions temporarily disabled - will integrate V3 on Feb 6th, 2026
 */
import { type Address } from 'viem';

/**
 * Deposit to Alchemix vault
 * TODO: Implement with Alchemix V3 contracts (Feb 6th, 2026)
 */
export async function depositToAlchemix(
  _vaultType: 'alUSD' | 'alETH',
  _amount: string,
  _userAddress: Address,
  _yieldToken?: Address,
): Promise<string> {
  throw new Error('Deposit functionality will be available with Alchemix V3 on Feb 6th, 2026');
}

/**
 * Borrow (mint) from Alchemix vault
 * TODO: Implement with Alchemix V3 contracts (Feb 6th, 2026)
 */
export async function borrowFromAlchemix(
  _vaultType: 'alUSD' | 'alETH',
  _amount: string,
  _userAddress: Address,
  _yieldToken?: Address
): Promise<string> {
  throw new Error('Borrow functionality will be available with Alchemix V3 on Feb 6th, 2026');
}

/**
 * Get user's position in a vault
 * TODO: Implement with Alchemix V3 contracts (Feb 6th, 2026)
 */
export async function getPosition(
  _vaultType: 'alUSD' | 'alETH',
  _userAddress: Address
): Promise<{
  deposited: string;
  borrowed: string;
  healthFactor: string;
}> {
  // Return placeholder data until V3 launch
  return {
    deposited: '0.00',
    borrowed: '0.00',
    healthFactor: 'Healthy',
  };
}

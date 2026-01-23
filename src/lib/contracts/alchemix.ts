/**
 * Alchemix V2 contract interfaces and utilities
 * Using audited contract ABIs for safe interactions
 */

import { createPublicClient, http, type Address, type Chain } from 'viem';
import type { VaultType, Position } from '@/types';
import { ALCHEMIX_V2_VAULTS, SUPPORTED_NETWORKS } from '@/lib/config/networks';
import { CastAlchemyError, ERROR_CODES } from '@/lib/utils/errors';

// Minimal ABI for Alchemix V2 vault interactions
// TODO: Replace with full audited ABI from Alchemix
const VAULT_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'getTotalDeposited',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getTotalBorrowed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getHealthFactor',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export class AlchemixV2Client {
  private publicClient;
  private chain: Chain;

  constructor(chainId: number, rpcUrl: string) {
    this.chain = {
      id: chainId,
      name: 'Custom',
      network: 'custom',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: [rpcUrl] },
        public: { http: [rpcUrl] },
      },
    } as Chain;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(),
    });
  }

  /**
   * Get user position for a vault
   */
  async getPosition(userAddress: Address, vaultType: VaultType): Promise<Position | null> {
    try {
      const vault = ALCHEMIX_V2_VAULTS[vaultType];
      if (!vault) {
        throw new CastAlchemyError(
          `Vault ${vaultType} not found`,
          ERROR_CODES.CONTRACT_ERROR,
          'Invalid vault type selected'
        );
      }

      // Validate address is not zero
      if (vault.address === '0x0000000000000000000000000000000000000000') {
        throw new CastAlchemyError(
          'Contract address not configured',
          ERROR_CODES.CONTRACT_ERROR,
          'Vault contract address needs to be configured'
        );
      }

      const [deposited, borrowed, healthFactor] = await Promise.all([
        this.publicClient.readContract({
          address: vault.address as Address,
          abi: VAULT_ABI,
          functionName: 'getTotalDeposited',
          args: [userAddress],
        }).catch(() => 0n),
        this.publicClient.readContract({
          address: vault.address as Address,
          abi: VAULT_ABI,
          functionName: 'getTotalBorrowed',
          args: [userAddress],
        }).catch(() => 0n),
        this.publicClient.readContract({
          address: vault.address as Address,
          abi: VAULT_ABI,
          functionName: 'getHealthFactor',
          args: [userAddress],
        }).catch(() => 0n),
      ]);

      return {
        userAddress,
        vaultType,
        deposited: deposited.toString(),
        borrowed: borrowed.toString(),
        healthFactor: Number(healthFactor) / 1e18,
        apy: 0, // TODO: Fetch from analytics
        lastUpdated: Date.now(),
      };
    } catch (error) {
      if (error instanceof CastAlchemyError) {
        throw error;
      }
      console.error('Error fetching position:', error);
      throw new CastAlchemyError(
        error instanceof Error ? error.message : 'Unknown error',
        ERROR_CODES.NETWORK_ERROR,
        'Failed to fetch position. Please try again.'
      );
    }
  }

  /**
   * Prepare deposit transaction
   */
  async prepareDeposit(vaultType: VaultType, amount: bigint, userAddress: Address) {
    const vault = ALCHEMIX_V2_VAULTS[vaultType];
    if (!vault) {
      throw new CastAlchemyError(
        `Vault ${vaultType} not found`,
        ERROR_CODES.INVALID_INPUT,
        'Invalid vault type'
      );
    }

    if (vault.address === '0x0000000000000000000000000000000000000000') {
      throw new CastAlchemyError(
        'Contract address not configured',
        ERROR_CODES.CONTRACT_ERROR,
        'Vault contract address needs to be configured'
      );
    }

    if (amount <= 0n) {
      throw new CastAlchemyError(
        'Invalid deposit amount',
        ERROR_CODES.INVALID_INPUT,
        'Deposit amount must be greater than zero'
      );
    }

    try {
      return {
        to: vault.address as Address,
        data: this.publicClient.encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'deposit',
          args: [amount],
        }),
        value: vaultType === 'alETH' ? amount : 0n,
      };
    } catch (error) {
      throw new CastAlchemyError(
        error instanceof Error ? error.message : 'Failed to prepare transaction',
        ERROR_CODES.CONTRACT_ERROR,
        'Failed to prepare deposit transaction'
      );
    }
  }

  /**
   * Prepare borrow transaction
   */
  async prepareBorrow(vaultType: VaultType, amount: bigint, userAddress: Address) {
    const vault = ALCHEMIX_V2_VAULTS[vaultType];
    if (!vault) {
      throw new CastAlchemyError(
        `Vault ${vaultType} not found`,
        ERROR_CODES.INVALID_INPUT,
        'Invalid vault type'
      );
    }

    if (vault.address === '0x0000000000000000000000000000000000000000') {
      throw new CastAlchemyError(
        'Contract address not configured',
        ERROR_CODES.CONTRACT_ERROR,
        'Vault contract address needs to be configured'
      );
    }

    if (amount <= 0n) {
      throw new CastAlchemyError(
        'Invalid borrow amount',
        ERROR_CODES.INVALID_INPUT,
        'Borrow amount must be greater than zero'
      );
    }

    try {
      return {
        to: vault.address as Address,
        data: this.publicClient.encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'borrow',
          args: [amount],
        }),
        value: 0n,
      };
    } catch (error) {
      throw new CastAlchemyError(
        error instanceof Error ? error.message : 'Failed to prepare transaction',
        ERROR_CODES.CONTRACT_ERROR,
        'Failed to prepare borrow transaction'
      );
    }
  }
}

/**
 * Get Alchemix client for a specific network
 */
export function getAlchemixClient(vaultType: VaultType) {
  const vault = ALCHEMIX_V2_VAULTS[vaultType];
  const networkConfig = SUPPORTED_NETWORKS[vault.network];
  return new AlchemixV2Client(networkConfig.chainId, networkConfig.rpcUrl);
}


/**
 * Alchemix V2 contract interfaces and utilities
 * Using audited contract ABIs for safe interactions
 */

import { createPublicClient, http, encodeFunctionData, type Address, type Chain } from 'viem';
import type { VaultType, Position } from '@/types';
import { ALCHEMIX_V2_VAULTS, SUPPORTED_NETWORKS } from '@/lib/config/networks';
import { CastAlchemyError, ERROR_CODES } from '@/lib/utils/errors';

// Alchemix V2 AlchemistV2 ABI (core functions)
// Source: https://github.com/alchemix-finance/alchemix-v2-contracts
const VAULT_ABI = [
  // Deposit functions
  {
    name: 'depositUnderlying',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yieldToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'minimumAmountOut', type: 'uint256' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yieldToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  // Borrow functions (called "mint" in Alchemix)
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'mintFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
  // Repay functions
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'burn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Query functions
  {
    name: 'accounts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'debt', type: 'int256' },
          { name: 'depositedTokens', type: 'address[]' },
        ],
      },
    ],
  },
  {
    name: 'positions',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'yieldToken', type: 'address' },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'shares', type: 'uint256' },
          { name: 'lastAccruedWeight', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'totalValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertSharesToUnderlyingTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'yieldToken', type: 'address' },
      { name: 'shares', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Health and limits
  {
    name: 'getCdpTotalDebt',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getCdpTotalCredit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minimumCollateralization',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export class AlchemixV2Client {
  private publicClient;
  private chain: Chain;

  private chainId: number;

  constructor(chainId: number, rpcUrl: string) {
    this.chainId = chainId;
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
   * Get the chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Get user position for a vault
   * Uses Alchemix V2 accounts() and totalValue() functions
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

      // Fetch account data and total value from Alchemix V2
      const [accountData, totalValue] = await Promise.all([
        this.publicClient.readContract({
          address: vault.address as Address,
          abi: VAULT_ABI,
          functionName: 'accounts',
          args: [userAddress],
        }).catch(() => ({ debt: 0n, depositedTokens: [] })),
        this.publicClient.readContract({
          address: vault.address as Address,
          abi: VAULT_ABI,
          functionName: 'totalValue',
          args: [userAddress],
        }).catch(() => 0n),
      ]);

      // Extract debt (stored as int256, can be negative)
      const debt = accountData.debt > 0n ? accountData.debt : 0n;
      
      // Calculate health factor (collateral / debt)
      // Alchemix requires 200% collateralization, so healthy = totalValue / debt >= 2
      let healthFactor = 0;
      if (debt > 0n && totalValue > 0n) {
        healthFactor = Number(totalValue) / Number(debt);
      } else if (debt === 0n && totalValue > 0n) {
        healthFactor = Infinity; // No debt = healthy
      }

      return {
        userAddress,
        vaultType,
        deposited: totalValue.toString(),
        borrowed: debt.toString(),
        healthFactor,
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
   * Prepare deposit transaction using Alchemix V2 depositUnderlying
   * @param vaultType - alUSD or alETH
   * @param amount - Amount in wei
   * @param userAddress - Recipient address
   * @param yieldToken - Yield token address (e.g., yvDAI for alUSD, yvWETH for alETH)
   */
  async prepareDeposit(
    vaultType: VaultType, 
    amount: bigint, 
    userAddress: Address,
    yieldToken?: Address
  ) {
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
      // Default yield tokens for each vault type
      // Note: These should be configured based on available yield tokens
      const defaultYieldToken = (yieldToken || vault.address) as Address;

      return {
        to: vault.address as Address,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'depositUnderlying',
          args: [
            defaultYieldToken,
            amount,
            userAddress,
            0n, // minimumAmountOut (0 for testing, should be calculated for production)
          ],
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
   * Prepare borrow transaction using Alchemix V2 mint function
   * Note: Alchemix calls borrowing "minting" since you mint synthetic assets
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
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'mint',
          args: [amount, userAddress],
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

  /**
   * Prepare repay transaction using Alchemix V2 burn function
   */
  async prepareRepay(vaultType: VaultType, amount: bigint, userAddress: Address) {
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
        'Invalid repay amount',
        ERROR_CODES.INVALID_INPUT,
        'Repay amount must be greater than zero'
      );
    }

    try {
      return {
        to: vault.address as Address,
        data: encodeFunctionData({
          abi: VAULT_ABI,
          functionName: 'burn',
          args: [amount, userAddress],
        }),
        value: 0n,
      };
    } catch (error) {
      throw new CastAlchemyError(
        error instanceof Error ? error.message : 'Failed to prepare transaction',
        ERROR_CODES.CONTRACT_ERROR,
        'Failed to prepare repay transaction'
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


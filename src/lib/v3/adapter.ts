import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
  type Chain,
} from 'viem';
import { alchemistV3PositionNftAbi, alchemistV3ReadAbi, alchemistV3WriteAbi } from './abi';
import { canUseContractV3, v3Config } from './config';
import { MockV3Adapter } from './mock';
import type {
  PrepareBurnParams,
  PrepareDepositParams,
  PrepareMintParams,
  PrepareRepayParams,
  PrepareSelfLiquidateParams,
  PrepareWithdrawParams,
  PreparedV3Transaction,
  V3Adapter,
  V3PositionDetail,
  V3PositionSummary,
  V3ProtocolState,
} from './types';

/**
 * Classify health factor into a user-friendly state.
 * Uses the minimumCollateralization from the contract when available,
 * but falls back to reasonable defaults.
 */
function getHealthState(healthFactor: number): V3PositionSummary['healthState'] {
  if (healthFactor >= 2) {
    return 'safe';
  }

  if (healthFactor >= 1.35) {
    return 'watch';
  }

  return 'danger';
}

function calculateHealthFactor(collateralValue: bigint, debt: bigint): number {
  if (debt === 0n) {
    return Number.POSITIVE_INFINITY;
  }

  const scaled = (collateralValue * 1_000n) / debt;
  return Number(scaled) / 1_000;
}

class ContractV3Adapter implements V3Adapter {
  readonly mode = 'contracts' as const;

  readonly config = v3Config;

  private publicClient: ReturnType<typeof createPublicClient> | null = null;

  private assertReady() {
    if (!canUseContractV3()) {
      throw new Error('Configure the NEXT_PUBLIC_ALCHEMIX_V3_* variables and RPC URL before enabling contract-backed V3 mode.');
    }
  }

  private getPublicClient() {
    this.assertReady();

    if (!this.publicClient) {
      const chain = {
        id: v3Config.chainId,
        name: 'Alchemix V3',
        network: 'alchemix-v3',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [v3Config.rpcUrl as string] },
          public: { http: [v3Config.rpcUrl as string] },
        },
      } as Chain;

      this.publicClient = createPublicClient({
        chain,
        transport: http(v3Config.rpcUrl as string),
      });
    }

    return this.publicClient;
  }

  private async buildPositionSummary(tokenId: bigint, owner?: Address): Promise<V3PositionSummary> {
    const client = this.getPublicClient();
    const resolvedOwner =
      owner ??
      (await client.readContract({
        address: v3Config.positionNftAddress,
        abi: alchemistV3PositionNftAbi,
        functionName: 'ownerOf',
        args: [tokenId],
      }));
    const [collateral, debt, earmarked] = (await client.readContract({
      address: v3Config.alchemistAddress,
      abi: alchemistV3ReadAbi,
      functionName: 'getCDP',
      args: [tokenId],
    })) as [bigint, bigint, bigint];
    const [collateralValue, maxBorrowable, maxWithdrawable] = await Promise.all([
      client.readContract({
        address: v3Config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'totalValue',
        args: [tokenId],
      }),
      client.readContract({
        address: v3Config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'getMaxBorrowable',
        args: [tokenId],
      }),
      client.readContract({
        address: v3Config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'getMaxWithdrawable',
        args: [tokenId],
      }),
    ]);

    const availableCredit = maxBorrowable > debt ? maxBorrowable - debt : 0n;
    const healthFactor = calculateHealthFactor(collateralValue, debt);

    return {
      tokenId,
      owner: resolvedOwner,
      collateral,
      debt,
      earmarked,
      collateralValue,
      maxBorrowable,
      maxWithdrawable,
      availableCredit,
      healthFactor,
      healthState: getHealthState(healthFactor),
      lastUpdated: Date.now(),
    };
  }

  isReady(): boolean {
    return canUseContractV3();
  }

  async getPositions(owner: Address): Promise<V3PositionSummary[]> {
    this.assertReady();
    const client = this.getPublicClient();
    const balance = await client.readContract({
      address: v3Config.positionNftAddress,
      abi: alchemistV3PositionNftAbi,
      functionName: 'balanceOf',
      args: [owner],
    });

    const count = Number(balance);
    if (count === 0) {
      return [];
    }

    const tokenIds = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        client.readContract({
          address: v3Config.positionNftAddress,
          abi: alchemistV3PositionNftAbi,
          functionName: 'tokenOfOwnerByIndex',
          args: [owner, BigInt(index)],
        })
      )
    );

    const positions = await Promise.all(tokenIds.map((tokenId) => this.buildPositionSummary(tokenId, owner)));
    return positions.sort((left, right) => Number(left.tokenId - right.tokenId));
  }

  async getPosition(tokenId: bigint, owner?: Address): Promise<V3PositionDetail | null> {
    this.assertReady();
    try {
      const summary = await this.buildPositionSummary(tokenId, owner);

      if (owner && summary.owner.toLowerCase() !== owner.toLowerCase()) {
        return null;
      }

      return {
        ...summary,
        label: `Position #${summary.tokenId.toString()}`,
      };
    } catch {
      return null;
    }
  }

  async getProtocolState(): Promise<V3ProtocolState> {
    this.assertReady();
    const client = this.getPublicClient();

    const [
      depositsPaused,
      loansPaused,
      minimumCollateralization,
      globalMinimumCollateralization,
      depositCap,
      totalDebt,
      totalDeposited,
      totalUnderlyingValue,
    ] = await Promise.all([
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'depositsPaused' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'loansPaused' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'minimumCollateralization' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'globalMinimumCollateralization' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'depositCap' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'totalDebt' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'getTotalDeposited' }),
      client.readContract({ address: v3Config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'getTotalUnderlyingValue' }),
    ]);

    return {
      depositsPaused: depositsPaused as boolean,
      loansPaused: loansPaused as boolean,
      minimumCollateralization: minimumCollateralization as bigint,
      globalMinimumCollateralization: globalMinimumCollateralization as bigint,
      depositCap: depositCap as bigint,
      totalDebt: totalDebt as bigint,
      totalDeposited: totalDeposited as bigint,
      totalUnderlyingValue: totalUnderlyingValue as bigint,
    };
  }

  async prepareDeposit(params: PrepareDepositParams): Promise<PreparedV3Transaction> {
    this.assertReady();
    if (params.amount <= 0n) {
      throw new Error('Deposit amount must be greater than zero.');
    }

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'deposit',
        args: [params.amount, params.recipient, params.recipientId ?? 0n],
      }),
      value: 0n,
    };
  }

  async prepareWithdraw(params: PrepareWithdrawParams): Promise<PreparedV3Transaction> {
    this.assertReady();
    if (params.amount <= 0n) {
      throw new Error('Withdraw amount must be greater than zero.');
    }

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'withdraw',
        args: [params.amount, params.recipient, params.tokenId],
      }),
      value: 0n,
    };
  }

  async prepareMint(params: PrepareMintParams): Promise<PreparedV3Transaction> {
    this.assertReady();
    if (params.amount <= 0n) {
      throw new Error('Mint amount must be greater than zero.');
    }

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'mint',
        args: [params.tokenId, params.amount, params.recipient],
      }),
      value: 0n,
    };
  }

  async prepareBurn(params: PrepareBurnParams): Promise<PreparedV3Transaction> {
    this.assertReady();
    if (params.amount <= 0n) {
      throw new Error('Burn amount must be greater than zero.');
    }

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'burn',
        args: [params.amount, params.recipientTokenId],
      }),
      value: 0n,
    };
  }

  async prepareRepay(params: PrepareRepayParams): Promise<PreparedV3Transaction> {
    this.assertReady();
    if (params.amount <= 0n) {
      throw new Error('Repay amount must be greater than zero.');
    }

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'repay',
        args: [params.amount, params.recipientTokenId],
      }),
      value: 0n,
    };
  }

  async prepareSelfLiquidate(params: PrepareSelfLiquidateParams): Promise<PreparedV3Transaction> {
    this.assertReady();

    return {
      chainId: v3Config.chainId,
      to: v3Config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'selfLiquidate',
        args: [params.accountId, params.recipient],
      }),
      value: 0n,
    };
  }
}

let adapter: V3Adapter | null = null;

export function getV3Adapter(): V3Adapter {
  if (!adapter) {
    adapter = v3Config.mode === 'contracts' ? new ContractV3Adapter() : new MockV3Adapter();
  }

  return adapter;
}

export function resetV3AdapterForTests() {
  adapter = null;
}

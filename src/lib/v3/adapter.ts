import {
  createPublicClient,
  encodeFunctionData,
  http,
  type Address,
  type Chain,
} from 'viem';
import { alchemistV3PositionNftAbi, alchemistV3ReadAbi, alchemistV3RouterAbi, alchemistV3WriteAbi } from './abi';
import { canUseContractV3, getV3Config, v3Config } from './config';
import type {
  PrepareBurnParams,
  PrepareDepositParams,
  PrepareMintParams,
  PrepareRepayParams,
  PrepareSelfLiquidateParams,
  PrepareWithdrawParams,
  PreparedV3Transaction,
  V3Adapter,
  V3ProtocolConfig,
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

  readonly config: V3ProtocolConfig;

  constructor(config: V3ProtocolConfig = v3Config) {
    this.config = config;
  }

  private publicClient: ReturnType<typeof createPublicClient> | null = null;

  private assertReady() {
    if (!canUseContractV3(this.config.chainId, this.config.marketId)) {
      throw new Error(`Configure the Alchemix V3 RPC URL for ${this.config.marketLabel} on chain ${this.config.chainId} before calling the V3 adapter.`);
    }
  }

  private getPublicClient() {
    this.assertReady();

    if (!this.publicClient) {
      const chain = {
        id: this.config.chainId,
        name: 'Alchemix V3',
        network: 'alchemix-v3',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: {
          default: { http: [this.config.rpcUrl as string] },
          public: { http: [this.config.rpcUrl as string] },
        },
      } as Chain;

      this.publicClient = createPublicClient({
        chain,
        transport: http(this.config.rpcUrl as string),
      });
    }

    return this.publicClient;
  }

  private async buildPositionSummary(tokenId: bigint, owner?: Address): Promise<V3PositionSummary> {
    const client = this.getPublicClient();
    const resolvedOwner =
      owner ??
      (await client.readContract({
        address: this.config.positionNftAddress,
        abi: alchemistV3PositionNftAbi,
        functionName: 'ownerOf',
        args: [tokenId],
      }));
    const [collateral, debt, earmarked] = (await client.readContract({
      address: this.config.alchemistAddress,
      abi: alchemistV3ReadAbi,
      functionName: 'getCDP',
      args: [tokenId],
    })) as [bigint, bigint, bigint];
    const [collateralValue, maxBorrowable, maxWithdrawable] = await Promise.all([
      client.readContract({
        address: this.config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'totalValue',
        args: [tokenId],
      }),
      client.readContract({
        address: this.config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'getMaxBorrowable',
        args: [tokenId],
      }),
      client.readContract({
        address: this.config.alchemistAddress,
        abi: alchemistV3ReadAbi,
        functionName: 'getMaxWithdrawable',
        args: [tokenId],
      }),
    ]);

    const availableCredit = maxBorrowable > debt ? maxBorrowable - debt : 0n;
    const healthFactor = calculateHealthFactor(collateralValue, debt);

    return {
      marketId: this.config.marketId,
      marketLabel: this.config.marketLabel,
      baseAssetSymbol: this.config.baseAssetSymbol,
      debtTokenSymbol: this.config.debtTokenSymbol,
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
    return canUseContractV3(this.config.chainId, this.config.marketId);
  }

  async getPositions(owner: Address): Promise<V3PositionSummary[]> {
    this.assertReady();
    const client = this.getPublicClient();
    const balance = await client.readContract({
      address: this.config.positionNftAddress,
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
          address: this.config.positionNftAddress,
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
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'depositsPaused' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'loansPaused' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'minimumCollateralization' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'globalMinimumCollateralization' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'depositCap' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'totalDebt' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'getTotalDeposited' }),
      client.readContract({ address: this.config.alchemistAddress, abi: alchemistV3ReadAbi, functionName: 'getTotalUnderlyingValue' }),
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

    const borrowAmount = params.borrowAmount ?? 0n;
    if (borrowAmount < 0n) {
      throw new Error('Borrow amount cannot be negative.');
    }

    const tokenId = params.recipientId ?? 0n;
    const minSharesOut = params.minSharesOut ?? 0n;
    const deadline = params.deadline ?? BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

    if (this.config.usesNativeEth) {
      return {
        chainId: this.config.chainId,
        to: this.config.routerAddress,
        data: encodeFunctionData({
          abi: alchemistV3RouterAbi,
          functionName: 'depositETH',
          args: [tokenId, borrowAmount, minSharesOut, deadline],
        }),
        value: params.amount,
      };
    }

    return {
      chainId: this.config.chainId,
      to: this.config.routerAddress,
      data: encodeFunctionData({
        abi: alchemistV3RouterAbi,
        functionName: 'depositUnderlying',
        args: [tokenId, params.amount, borrowAmount, minSharesOut, deadline],
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
      chainId: this.config.chainId,
      to: this.config.alchemistAddress,
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
      chainId: this.config.chainId,
      to: this.config.alchemistAddress,
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
      chainId: this.config.chainId,
      to: this.config.alchemistAddress,
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
      chainId: this.config.chainId,
      to: this.config.alchemistAddress,
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
      chainId: this.config.chainId,
      to: this.config.alchemistAddress,
      data: encodeFunctionData({
        abi: alchemistV3WriteAbi,
        functionName: 'selfLiquidate',
        args: [params.accountId, params.recipient],
      }),
      value: 0n,
    };
  }
}

const adapters = new Map<string, V3Adapter>();

export function getV3Adapter(chainId: number = v3Config.chainId, marketId: string = v3Config.marketId): V3Adapter {
  const config = getV3Config(chainId, marketId);
  const adapterKey = `${config.chainId}:${config.marketId}`;
  let adapter = adapters.get(adapterKey);

  if (!adapter) {
    adapter = new ContractV3Adapter(config);
    adapters.set(adapterKey, adapter);
  }

  return adapter;
}

export function resetV3AdapterForTests() {
  adapters.clear();
}

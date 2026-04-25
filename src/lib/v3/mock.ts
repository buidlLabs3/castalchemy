import type { Address, Hex } from 'viem';
import { ZERO_ADDRESS, v3Config } from './config';
import type {
  PrepareBurnParams,
  PrepareDepositParams,
  PrepareMintParams,
  PrepareRepayParams,
  PrepareSelfLiquidateParams,
  PrepareWithdrawParams,
  PreparedV3Transaction,
  V3Adapter,
  V3HealthState,
  V3PositionDetail,
  V3PositionSummary,
  V3ProtocolState,
} from './types';

const WEI = 10n ** 18n;
const BPS = 10_000n;
const MAX_LTV_BPS = 7_500n;
const PLACEHOLDER_DATA = '0x' as Hex;

function getSeed(owner: Address): number {
  return Number.parseInt(owner.slice(-8), 16);
}

function getHealthState(healthFactor: number): V3HealthState {
  if (healthFactor >= 2) {
    return 'safe';
  }

  if (healthFactor >= 1.35) {
    return 'watch';
  }

  return 'danger';
}

function createTokenIds(owner: Address): bigint[] {
  const seed = getSeed(owner);
  const base = BigInt((seed % 9_000) + 1);
  const count = seed % 3 === 0 ? 2 : 1;

  return Array.from({ length: count }, (_, index) => base + BigInt(index));
}

function calculateHealthFactor(collateralValue: bigint, debt: bigint): number {
  if (debt === 0n) {
    return Number.POSITIVE_INFINITY;
  }

  const scaled = (collateralValue * 1_000n) / debt;
  return Number(scaled) / 1_000;
}

function buildPosition(owner: Address, tokenId: bigint, slot: number): V3PositionSummary {
  const collateralUnits = BigInt(5_000 + slot * 2_500);
  const collateral = collateralUnits * WEI;
  const debt = (collateral * BigInt(3_000 + slot * 700)) / BPS;
  const earmarked = debt / 10n;
  const collateralValue = collateral;
  const maxBorrowable = (collateralValue * MAX_LTV_BPS) / BPS;
  const maxWithdrawable = collateral - (debt * BPS) / MAX_LTV_BPS;
  const availableCredit = maxBorrowable > debt ? maxBorrowable - debt : 0n;
  const healthFactor = calculateHealthFactor(collateralValue, debt);

  return {
    tokenId,
    owner,
    collateral,
    debt,
    earmarked,
    collateralValue,
    maxBorrowable,
    maxWithdrawable: maxWithdrawable > 0n ? maxWithdrawable : 0n,
    availableCredit,
    healthFactor,
    healthState: getHealthState(healthFactor),
    lastUpdated: Date.now(),
  };
}

function syntheticOwnerFromTokenId(tokenId: bigint): Address {
  const hex = tokenId.toString(16).padStart(40, '0').slice(-40);
  return `0x${hex}` as Address;
}

function toTransaction(to: Address): PreparedV3Transaction {
  return {
    chainId: v3Config.chainId,
    to,
    data: PLACEHOLDER_DATA,
    value: 0n,
  };
}

function assertPositive(value: bigint, label: string) {
  if (value <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }
}

function resolveAlchemistAddress(): Address {
  return v3Config.alchemistAddress === ZERO_ADDRESS ? ZERO_ADDRESS : v3Config.alchemistAddress;
}

export class MockV3Adapter implements V3Adapter {
  readonly mode = 'mock' as const;

  readonly config = v3Config;

  isReady(): boolean {
    return true;
  }

  async getPositions(owner: Address): Promise<V3PositionSummary[]> {
    return createTokenIds(owner).map((tokenId, index) => buildPosition(owner, tokenId, index + 1));
  }

  async getPosition(tokenId: bigint, owner?: Address): Promise<V3PositionDetail | null> {
    const resolvedOwner = owner ?? syntheticOwnerFromTokenId(tokenId);
    const positions = await this.getPositions(resolvedOwner);
    const summary = positions.find((item) => item.tokenId === tokenId);

    if (!summary) {
      return owner ? null : { ...buildPosition(resolvedOwner, tokenId, 1), label: `Position #${tokenId.toString()}` };
    }

    return {
      ...summary,
      label: `Position #${summary.tokenId.toString()}`,
    };
  }

  async getProtocolState(): Promise<V3ProtocolState> {
    return {
      depositsPaused: false,
      loansPaused: false,
      minimumCollateralization: (WEI * 11n) / 10n, // 110%
      globalMinimumCollateralization: (WEI * 12n) / 10n, // 120%
      depositCap: 100_000n * WEI,
      totalDebt: 42_000n * WEI,
      totalDeposited: 85_000n * WEI,
      totalUnderlyingValue: 88_000n * WEI,
    };
  }

  async prepareDeposit(params: PrepareDepositParams): Promise<PreparedV3Transaction> {
    assertPositive(params.amount, 'Deposit amount');
    return toTransaction(resolveAlchemistAddress());
  }

  async prepareWithdraw(params: PrepareWithdrawParams): Promise<PreparedV3Transaction> {
    assertPositive(params.amount, 'Withdraw amount');
    return toTransaction(resolveAlchemistAddress());
  }

  async prepareMint(params: PrepareMintParams): Promise<PreparedV3Transaction> {
    assertPositive(params.amount, 'Mint amount');
    return toTransaction(resolveAlchemistAddress());
  }

  async prepareBurn(params: PrepareBurnParams): Promise<PreparedV3Transaction> {
    assertPositive(params.amount, 'Burn amount');
    return toTransaction(resolveAlchemistAddress());
  }

  async prepareRepay(params: PrepareRepayParams): Promise<PreparedV3Transaction> {
    assertPositive(params.amount, 'Repay amount');
    return toTransaction(resolveAlchemistAddress());
  }

  async prepareSelfLiquidate(_params: PrepareSelfLiquidateParams): Promise<PreparedV3Transaction> {
    return toTransaction(resolveAlchemistAddress());
  }
}

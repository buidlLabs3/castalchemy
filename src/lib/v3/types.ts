import type { Address, Hex } from 'viem';

export type V3AdapterMode = 'mock' | 'contracts';
export type V3HealthState = 'safe' | 'watch' | 'danger';

export interface V3ProtocolConfig {
  enabled: boolean;
  mode: V3AdapterMode;
  chainId: number;
  rpcUrl: string | null;
  alchemistAddress: Address;
  positionNftAddress: Address;
  transmuterAddress: Address;
  debtTokenAddress: Address;
  underlyingTokenAddress: Address;
  isConfigured: boolean;
}

export interface V3PositionSummary {
  tokenId: bigint;
  owner: Address;
  collateral: bigint;
  debt: bigint;
  earmarked: bigint;
  collateralValue: bigint;
  maxBorrowable: bigint;
  availableCredit: bigint;
  healthFactor: number;
  healthState: V3HealthState;
  lastUpdated: number;
}

export interface V3PositionDetail extends V3PositionSummary {
  label: string;
}

export interface PreparedV3Transaction {
  chainId: number;
  to: Address;
  data: Hex;
  value: bigint;
}

export interface PrepareDepositParams {
  amount: bigint;
  recipient: Address;
  recipientId?: bigint;
}

export interface PrepareWithdrawParams {
  tokenId: bigint;
  amount: bigint;
  recipient: Address;
}

export interface PrepareMintParams {
  tokenId: bigint;
  amount: bigint;
  recipient: Address;
}

export interface PrepareBurnParams {
  amount: bigint;
  recipientTokenId: bigint;
}

export interface PrepareRepayParams {
  amount: bigint;
  recipientTokenId: bigint;
}

export interface V3Adapter {
  readonly mode: V3AdapterMode;
  readonly config: V3ProtocolConfig;
  isReady(): boolean;
  getPositions(owner: Address): Promise<V3PositionSummary[]>;
  getPosition(tokenId: bigint, owner?: Address): Promise<V3PositionDetail | null>;
  prepareDeposit(params: PrepareDepositParams): Promise<PreparedV3Transaction>;
  prepareWithdraw(params: PrepareWithdrawParams): Promise<PreparedV3Transaction>;
  prepareMint(params: PrepareMintParams): Promise<PreparedV3Transaction>;
  prepareBurn(params: PrepareBurnParams): Promise<PreparedV3Transaction>;
  prepareRepay(params: PrepareRepayParams): Promise<PreparedV3Transaction>;
}

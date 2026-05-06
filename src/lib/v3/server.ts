import type { SendTransactionParameters, TransactionResponse } from 'frog';
import { isAddress, parseUnits, type Address } from 'viem';
import { getV3Adapter } from './adapter';
import {
  isSupportedV3ChainId,
  isSupportedV3MarketId,
  SUPPORTED_V3_CHAIN_IDS,
  v3Config,
} from './config';
import type {
  PreparedV3Transaction,
  V3Adapter,
  V3MarketId,
  V3PositionDetail,
  V3PositionSummary,
} from './types';

const SUPPORTED_FRAME_CHAIN_IDS = new Set<number>(SUPPORTED_V3_CHAIN_IDS);

function toFrameChainId(chainId: number): SendTransactionParameters['chainId'] {
  if (!SUPPORTED_FRAME_CHAIN_IDS.has(chainId)) {
    throw new Error(`Chain ${chainId} is not supported by Farcaster transaction frames.`);
  }

  return `eip155:${chainId}` as SendTransactionParameters['chainId'];
}

export function parseV3ChainId(value: string | null | undefined): number {
  if (!value) {
    return v3Config.chainId;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || !isSupportedV3ChainId(parsed)) {
    throw new Error('Chain must be Ethereum mainnet.');
  }

  return parsed;
}

export function parseV3MarketId(value: string | null | undefined): V3MarketId {
  if (!value) {
    return v3Config.marketId;
  }

  if (!isSupportedV3MarketId(value)) {
    throw new Error('Market must be USDC/alUSD or ETH/alETH.');
  }

  return value;
}

export function getServerV3Adapter(
  chainId: number = v3Config.chainId,
  marketId: string = v3Config.marketId,
): V3Adapter {
  const adapter = getV3Adapter(chainId, marketId);

  if (!adapter.config.enabled) {
    throw new Error('Alchemix V3 is currently disabled.');
  }

  if (!adapter.isReady()) {
    throw new Error('Alchemix V3 is not configured yet. Set RPC URL and contract addresses.');
  }

  return adapter;
}

export function parseV3AmountInput(value: string | null | undefined, label = 'Amount', decimals = 18): bigint {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  let parsed: bigint;

  try {
    parsed = parseUnits(normalized, decimals);
  } catch {
    throw new Error(`${label} must be a valid decimal amount.`);
  }

  if (parsed <= 0n) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return parsed;
}

export function parseV3Recipient(value: string | null | undefined, label = 'Recipient'): Address {
  if (!value || !isAddress(value)) {
    throw new Error(`${label} must be a valid wallet address.`);
  }

  return value;
}

export function parseOptionalTokenId(value: string | null | undefined, label = 'Position'): bigint | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = BigInt(normalized);

    if (parsed < 0n) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new Error(`${label} ID must be a valid non-negative integer.`);
  }
}

export function parseRequiredTokenId(value: string | null | undefined, label = 'Position'): bigint {
  const parsed = parseOptionalTokenId(value, label);

  if (parsed === undefined) {
    throw new Error(`${label} ID is required.`);
  }

  return parsed;
}

export async function getOwnedV3Position(
  owner: Address,
  tokenIdValue: string | null | undefined,
  label = 'Position',
  chainId: number = v3Config.chainId,
  marketId: string = v3Config.marketId,
): Promise<V3PositionDetail> {
  const tokenId = parseRequiredTokenId(tokenIdValue, label);
  const adapter = getServerV3Adapter(chainId, marketId);
  const position = await adapter.getPosition(tokenId, owner);

  if (!position) {
    throw new Error(`${label} #${tokenId.toString()} was not found for this wallet.`);
  }

  return position;
}

function assertWithinLimit(amount: bigint, limit: bigint, message: string) {
  if (amount > limit) {
    throw new Error(message);
  }
}

export function assertV3Withdrawable(position: V3PositionSummary, amount: bigint) {
  assertWithinLimit(amount, position.maxWithdrawable, 'Withdraw amount exceeds the maximum safe withdrawable amount for this position.');
}

export function assertV3Borrowable(position: V3PositionSummary, amount: bigint) {
  assertWithinLimit(amount, position.availableCredit, 'Borrow amount exceeds the selected position available credit.');
}

export function assertV3DebtAmount(position: V3PositionSummary, amount: bigint, action: 'repay' | 'burn') {
  const capitalized = action.charAt(0).toUpperCase() + action.slice(1);
  assertWithinLimit(amount, position.debt, `${capitalized} amount exceeds the selected position debt.`);
}

export function toV3SendTransaction(tx: PreparedV3Transaction): SendTransactionParameters {
  return {
    chainId: toFrameChainId(tx.chainId),
    to: tx.to,
    data: tx.data,
    value: tx.value,
  };
}

export function toV3TransactionResponse(tx: PreparedV3Transaction): TransactionResponse {
  return {
    chainId: toFrameChainId(tx.chainId),
    method: 'eth_sendTransaction',
    params: {
      abi: [],
      to: tx.to,
      data: tx.data,
      value: tx.value.toString(),
    },
  };
}

import type { SendTransactionParameters, TransactionResponse } from 'frog';
import { isAddress, parseEther, type Address } from 'viem';
import { getV3Adapter } from './adapter';
import type { PreparedV3Transaction, V3Adapter, V3PositionDetail, V3PositionSummary } from './types';

const SUPPORTED_FRAME_CHAIN_IDS = new Set<number>([
  1,
  10,
  100,
  137,
  8453,
  42161,
  42170,
  84532,
  421614,
  7777777,
  11155111,
  11155420,
  666666666,
]);

function toFrameChainId(chainId: number): SendTransactionParameters['chainId'] {
  if (!SUPPORTED_FRAME_CHAIN_IDS.has(chainId)) {
    throw new Error(`Chain ${chainId} is not supported by Farcaster transaction frames.`);
  }

  return `eip155:${chainId}` as SendTransactionParameters['chainId'];
}

export function getServerV3Adapter(): V3Adapter {
  const adapter = getV3Adapter();

  if (!adapter.config.enabled) {
    throw new Error('Alchemix V3 is currently disabled.');
  }

  if (!adapter.isReady()) {
    throw new Error('Alchemix V3 contract mode is not configured yet.');
  }

  return adapter;
}

export function parseV3AmountInput(value: string | null | undefined, label = 'Amount'): bigint {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  let parsed: bigint;

  try {
    parsed = parseEther(normalized);
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
): Promise<V3PositionDetail> {
  const tokenId = parseRequiredTokenId(tokenIdValue, label);
  const adapter = getServerV3Adapter();
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
  assertWithinLimit(amount, position.collateral, 'Withdraw amount exceeds the selected position collateral.');
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

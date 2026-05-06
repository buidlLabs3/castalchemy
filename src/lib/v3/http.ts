import type { TransactionResponse } from 'frog';
import {
  assertV3Borrowable,
  assertV3DebtAmount,
  assertV3Withdrawable,
  getOwnedV3Position,
  getServerV3Adapter,
  parseOptionalTokenId,
  parseV3ChainId,
  parseV3AmountInput,
  parseV3MarketId,
  parseV3Recipient,
  toV3TransactionResponse,
} from './server';
import { getV3Config, ZERO_ADDRESS } from './config';
import { encodeFunctionData } from 'viem';

/** Standard ERC-20 approve ABI fragment. */
const erc20ApproveAbi = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export async function buildV3DepositTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const recipient = parseV3Recipient(searchParams.get('recipient'));
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const config = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Deposit amount', config.underlyingDecimals);
  const borrowAmount = searchParams.has('borrowAmount')
    ? parseV3AmountInput(searchParams.get('borrowAmount'), 'Borrow amount', config.debtTokenDecimals)
    : 0n;
  const recipientId = parseOptionalTokenId(searchParams.get('recipientId'), 'Recipient');
  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareDeposit({
    amount,
    recipient,
    recipientId,
    borrowAmount,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3WithdrawTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const recipient = parseV3Recipient(searchParams.get('recipient'));
  const owner = parseV3Recipient(searchParams.get('owner') ?? searchParams.get('recipient'), 'Owner');
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const config = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Withdraw amount', config.mytDecimals);
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'), 'Position', chainId, marketId);

  assertV3Withdrawable(position, amount);

  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareWithdraw({
    tokenId: position.tokenId,
    amount,
    recipient,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3BorrowTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const recipient = parseV3Recipient(searchParams.get('recipient'));
  const owner = parseV3Recipient(searchParams.get('owner') ?? searchParams.get('recipient'), 'Owner');
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const config = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Borrow amount', config.debtTokenDecimals);
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'), 'Position', chainId, marketId);

  assertV3Borrowable(position, amount);

  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareMint({
    tokenId: position.tokenId,
    amount,
    recipient,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3RepayTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const owner = parseV3Recipient(searchParams.get('owner'), 'Owner');
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const config = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Repay amount', config.mytDecimals);
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'), 'Position', chainId, marketId);

  assertV3DebtAmount(position, amount, 'repay');

  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareRepay({
    amount,
    recipientTokenId: position.tokenId,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3BurnTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const owner = parseV3Recipient(searchParams.get('owner'), 'Owner');
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const config = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Burn amount', config.debtTokenDecimals);
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'), 'Position', chainId, marketId);

  assertV3DebtAmount(position, amount, 'burn');

  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareBurn({
    amount,
    recipientTokenId: position.tokenId,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3SelfLiquidateTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const owner = parseV3Recipient(searchParams.get('owner'), 'Owner');
  const recipient = parseV3Recipient(searchParams.get('recipient') ?? searchParams.get('owner'), 'Recipient');
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'), 'Position', chainId, marketId);

  if (position.debt === 0n) {
    throw new Error('This position has no debt to self-liquidate.');
  }

  const adapter = getServerV3Adapter(chainId, marketId);
  const tx = await adapter.prepareSelfLiquidate({
    accountId: position.tokenId,
    recipient,
  });

  return toV3TransactionResponse(tx);
}

/**
 * Build an ERC-20 approve transaction for the underlying token.
 * Must be called before a deposit when the user has not yet approved
 * the Alchemist to spend their tokens.
 */
export function buildV3ApproveTransactionResponse(
  searchParams: URLSearchParams,
): TransactionResponse {
  const chainId = parseV3ChainId(searchParams.get('chainId'));
  const marketId = parseV3MarketId(searchParams.get('market'));
  const chainConfig = getV3Config(chainId, marketId);
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Approval amount', chainConfig.underlyingDecimals);
  const tokenAddress = chainConfig.underlyingTokenAddress;

  if (chainConfig.usesNativeEth) {
    throw new Error('Native ETH deposits do not need an ERC-20 approval.');
  }

  if (!tokenAddress || tokenAddress === ZERO_ADDRESS) {
    throw new Error('Underlying token address is not configured.');
  }

  const data = encodeFunctionData({
    abi: erc20ApproveAbi,
    functionName: 'approve',
    args: [chainConfig.routerAddress, amount],
  });

  return {
    chainId: `eip155:${chainConfig.chainId}` as TransactionResponse['chainId'],
    method: 'eth_sendTransaction',
    params: {
      abi: [],
      to: tokenAddress,
      data,
      value: '0',
    },
  };
}

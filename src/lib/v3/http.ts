import type { TransactionResponse } from 'frog';
import {
  assertV3Borrowable,
  assertV3DebtAmount,
  assertV3Withdrawable,
  getOwnedV3Position,
  getServerV3Adapter,
  parseOptionalTokenId,
  parseV3AmountInput,
  parseV3Recipient,
  toV3TransactionResponse,
} from './server';
import { v3Config } from './config';
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
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Deposit amount');
  const recipientId = parseOptionalTokenId(searchParams.get('recipientId'), 'Recipient');
  const adapter = getServerV3Adapter();
  const tx = await adapter.prepareDeposit({
    amount,
    recipient,
    recipientId,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3WithdrawTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const recipient = parseV3Recipient(searchParams.get('recipient'));
  const owner = parseV3Recipient(searchParams.get('owner') ?? searchParams.get('recipient'), 'Owner');
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Withdraw amount');
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'));

  assertV3Withdrawable(position, amount);

  const adapter = getServerV3Adapter();
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
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Borrow amount');
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'));

  assertV3Borrowable(position, amount);

  const adapter = getServerV3Adapter();
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
  const owner = parseV3Recipient(searchParams.get('owner'));
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Repay amount');
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'));

  assertV3DebtAmount(position, amount, 'repay');

  const adapter = getServerV3Adapter();
  const tx = await adapter.prepareRepay({
    amount,
    recipientTokenId: position.tokenId,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3BurnTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const owner = parseV3Recipient(searchParams.get('owner'));
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Burn amount');
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'));

  assertV3DebtAmount(position, amount, 'burn');

  const adapter = getServerV3Adapter();
  const tx = await adapter.prepareBurn({
    amount,
    recipientTokenId: position.tokenId,
  });

  return toV3TransactionResponse(tx);
}

export async function buildV3SelfLiquidateTransactionResponse(
  searchParams: URLSearchParams,
): Promise<TransactionResponse> {
  const owner = parseV3Recipient(searchParams.get('owner'));
  const recipient = parseV3Recipient(searchParams.get('recipient') ?? searchParams.get('owner'), 'Recipient');
  const position = await getOwnedV3Position(owner, searchParams.get('tokenId'));

  if (position.debt === 0n) {
    throw new Error('This position has no debt to self-liquidate.');
  }

  const adapter = getServerV3Adapter();
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
  const amount = parseV3AmountInput(searchParams.get('amount'), 'Approval amount');
  const tokenAddress = v3Config.underlyingTokenAddress;

  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('Underlying token address is not configured.');
  }

  const data = encodeFunctionData({
    abi: erc20ApproveAbi,
    functionName: 'approve',
    args: [v3Config.alchemistAddress, amount],
  });

  return {
    chainId: `eip155:${v3Config.chainId}` as TransactionResponse['chainId'],
    method: 'eth_sendTransaction',
    params: {
      abi: [],
      to: tokenAddress,
      data,
      value: '0',
    },
  };
}


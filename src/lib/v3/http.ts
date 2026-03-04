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

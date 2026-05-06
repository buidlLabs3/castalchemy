import assert from 'node:assert/strict';
import test from 'node:test';

const OWNER_ADDRESS = '0x0000000000000000000000000000000000000012';

process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3 = 'true';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID = '1';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL = 'https://eth.llamarpc.com';

const configModule = await import('../src/lib/v3/config');
const serverModule = await import('../src/lib/v3/server');

const { ZERO_ADDRESS } = configModule;
const {
  assertV3Borrowable,
  assertV3DebtAmount,
  assertV3Withdrawable,
  parseOptionalTokenId,
  parseRequiredTokenId,
  parseV3AmountInput,
  parseV3MarketId,
  parseV3Recipient,
  toV3TransactionResponse,
} = serverModule;

test('parseV3AmountInput parses positive decimal amounts', () => {
  assert.equal(parseV3AmountInput('1.25', 'Deposit amount'), 1_250_000_000_000_000_000n);
  assert.equal(parseV3AmountInput('1.25', 'USDC amount', 6), 1_250_000n);
});

test('parseV3AmountInput rejects invalid values', () => {
  assert.throws(() => parseV3AmountInput('', 'Deposit amount'), /Deposit amount is required/);
  assert.throws(() => parseV3AmountInput('abc', 'Deposit amount'), /Deposit amount must be a valid decimal amount/);
  assert.throws(() => parseV3AmountInput('0', 'Deposit amount'), /Deposit amount must be greater than zero/);
});

test('parseV3Recipient validates wallet addresses', () => {
  assert.equal(parseV3Recipient(OWNER_ADDRESS), OWNER_ADDRESS);
  assert.throws(() => parseV3Recipient('not-an-address', 'Owner'), /Owner must be a valid wallet address/);
});

test('parseV3MarketId only accepts verified V3 markets', () => {
  assert.equal(parseV3MarketId('usdc'), 'usdc');
  assert.equal(parseV3MarketId('eth'), 'eth');
  assert.throws(() => parseV3MarketId('sepolia'), /Market must be USDC\/alUSD or ETH\/alETH/);
});

test('token id parsing supports optional and required values', () => {
  assert.equal(parseOptionalTokenId(null), undefined);
  assert.equal(parseOptionalTokenId('42'), 42n);
  assert.equal(parseRequiredTokenId('7'), 7n);
  assert.throws(() => parseRequiredTokenId(undefined, 'Position'), /Position ID is required/);
  assert.throws(() => parseOptionalTokenId('-1', 'Position'), /Position ID must be a valid non-negative integer/);
});

test('limit validators reject out-of-range values', () => {
  const position = {
    marketId: 'usdc' as const,
    marketLabel: 'USDC / alUSD',
    baseAssetSymbol: 'USDC',
    debtTokenSymbol: 'alUSD',
    tokenId: 1n,
    owner: OWNER_ADDRESS as `0x${string}`,
    collateral: 10n ** 18n,
    debt: 5n ** 17n,
    earmarked: 0n,
    collateralValue: 10n ** 18n,
    maxBorrowable: 8n ** 17n,
    maxWithdrawable: 4n ** 17n,
    availableCredit: 3n ** 17n,
    healthFactor: 2,
    healthState: 'safe' as const,
    lastUpdated: Date.now(),
  };

  assert.doesNotThrow(() => assertV3Withdrawable(position, position.maxWithdrawable));
  assert.doesNotThrow(() => assertV3Borrowable(position, position.availableCredit));
  assert.doesNotThrow(() => assertV3DebtAmount(position, position.debt, 'repay'));

  assert.throws(
    () => assertV3Withdrawable(position, position.maxWithdrawable + 1n),
    /Withdraw amount exceeds the maximum safe withdrawable amount/,
  );
  assert.throws(
    () => assertV3Borrowable(position, position.availableCredit + 1n),
    /Borrow amount exceeds the selected position available credit/,
  );
  assert.throws(
    () => assertV3DebtAmount(position, position.debt + 1n, 'burn'),
    /Burn amount exceeds the selected position debt/,
  );
});

test('toV3TransactionResponse formats Farcaster transaction payloads', () => {
  const response = toV3TransactionResponse({
    chainId: 1,
    to: ZERO_ADDRESS,
    data: '0x',
    value: 0n,
  });

  assert.equal(response.chainId, 'eip155:1');
  assert.equal(response.method, 'eth_sendTransaction');
  assert.equal(response.params.to, ZERO_ADDRESS);
  assert.equal(response.params.value, '0');
});

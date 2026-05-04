import assert from 'node:assert/strict';
import test from 'node:test';

const OWNER_ADDRESS = '0x0000000000000000000000000000000000000012';
const ALCHEMIST_ADDRESS = '0x1111111111111111111111111111111111111111';

process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3 = 'true';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID = '11155111';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL = 'https://rpc.sepolia.org';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS = ALCHEMIST_ADDRESS;
process.env.NEXT_PUBLIC_ALCHEMIX_V3_POSITION_NFT_ADDRESS = '0x2222222222222222222222222222222222222222';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_TRANSMUTER_ADDRESS = '0x3333333333333333333333333333333333333333';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_DEBT_TOKEN_ADDRESS = '0x4444444444444444444444444444444444444444';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_UNDERLYING_TOKEN_ADDRESS = '0x5555555555555555555555555555555555555555';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_MYT_ADDRESS = '0x6666666666666666666666666666666666666666';

const adapterModule = await import('../src/lib/v3/adapter');
const httpModule = await import('../src/lib/v3/http');

const { resetV3AdapterForTests } = adapterModule;
const {
  buildV3BorrowTransactionResponse,
  buildV3BurnTransactionResponse,
  buildV3DepositTransactionResponse,
  buildV3RepayTransactionResponse,
  buildV3WithdrawTransactionResponse,
} = httpModule;

test('buildV3DepositTransactionResponse returns encoded calldata to the Alchemist', async () => {
  resetV3AdapterForTests();
  const response = await buildV3DepositTransactionResponse(
    new URLSearchParams({
      recipient: OWNER_ADDRESS,
      amount: '1.5',
    }),
  );

  assert.equal(response.chainId, 'eip155:11155111');
  assert.equal(response.method, 'eth_sendTransaction');
  assert.equal(response.params.to, ALCHEMIST_ADDRESS);
  const data = response.params.data;
  assert.ok(typeof data === 'string');
  assert.match(data, /^0x[0-9a-f]+$/i);
  assert.ok(data.length > 10);
  assert.equal(response.params.value, '0');
});

test('buildV3BorrowTransactionResponse rejects missing recipient', async () => {
  resetV3AdapterForTests();
  await assert.rejects(
    () =>
      buildV3BorrowTransactionResponse(
        new URLSearchParams({
          tokenId: '1',
          amount: '0.1',
        }),
      ),
    /Recipient must be a valid wallet address/,
  );
});

test('buildV3WithdrawTransactionResponse rejects missing recipient', async () => {
  resetV3AdapterForTests();
  await assert.rejects(
    () =>
      buildV3WithdrawTransactionResponse(
        new URLSearchParams({
          tokenId: '1',
          amount: '0.1',
        }),
      ),
    /Recipient must be a valid wallet address/,
  );
});

test('buildV3RepayTransactionResponse rejects missing owner', async () => {
  resetV3AdapterForTests();
  await assert.rejects(
    () =>
      buildV3RepayTransactionResponse(
        new URLSearchParams({
          tokenId: '1',
          amount: '0.1',
        }),
      ),
    /Owner must be a valid wallet address/,
  );
});

test('buildV3BurnTransactionResponse rejects missing owner', async () => {
  resetV3AdapterForTests();
  await assert.rejects(
    () =>
      buildV3BurnTransactionResponse(
        new URLSearchParams({
          tokenId: '1',
          amount: '0.1',
        }),
      ),
    /Owner must be a valid wallet address/,
  );
});

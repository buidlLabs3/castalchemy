import assert from 'node:assert/strict';
import test from 'node:test';

const OWNER_ADDRESS = '0x0000000000000000000000000000000000000012';
const USDC_ROUTER_ADDRESS = '0x6733aa6b2a622e43e8ff61945e8fbe5f1b6b00fd';
const ETH_ROUTER_ADDRESS = '0xdb852896a23c7e2519b75aea692cacf834d086ab';

process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3 = 'true';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID = '1';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL = 'https://eth.llamarpc.com';

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

test('buildV3DepositTransactionResponse returns encoded calldata to the USDC router', async () => {
  resetV3AdapterForTests();
  const response = await buildV3DepositTransactionResponse(
    new URLSearchParams({
      recipient: OWNER_ADDRESS,
      amount: '1.5',
      market: 'usdc',
    }),
  );

  assert.equal(response.chainId, 'eip155:1');
  assert.equal(response.method, 'eth_sendTransaction');
  assert.equal(response.params.to, USDC_ROUTER_ADDRESS);
  const data = response.params.data;
  assert.ok(typeof data === 'string');
  assert.match(data, /^0x[0-9a-f]+$/i);
  assert.ok(data.length > 10);
  assert.equal(response.params.value, '0');
});

test('buildV3DepositTransactionResponse sends native value to the ETH router', async () => {
  resetV3AdapterForTests();
  const response = await buildV3DepositTransactionResponse(
    new URLSearchParams({
      recipient: OWNER_ADDRESS,
      amount: '1.5',
      borrowAmount: '0.25',
      market: 'eth',
    }),
  );

  assert.equal(response.chainId, 'eip155:1');
  assert.equal(response.method, 'eth_sendTransaction');
  assert.equal(response.params.to, ETH_ROUTER_ADDRESS);
  assert.equal(response.params.value, '1500000000000000000');
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

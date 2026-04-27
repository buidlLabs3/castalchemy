import assert from 'node:assert/strict';
import test from 'node:test';

const ALCHEMIST_ADDRESS = '0x1111111111111111111111111111111111111111';
const OWNER_ADDRESS = '0x0000000000000000000000000000000000000012';
const ALT_RECIPIENT = '0x0000000000000000000000000000000000000042';

process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3 = 'true';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_MODE = 'mock';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID = '11155111';
process.env.NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS = ALCHEMIST_ADDRESS;

const adapterModule = await import('../src/lib/v3/adapter');
const serverModule = await import('../src/lib/v3/server');
const httpModule = await import('../src/lib/v3/http');

const { resetV3AdapterForTests } = adapterModule;
const { getServerV3Adapter } = serverModule;
const {
  buildV3BorrowTransactionResponse,
  buildV3BurnTransactionResponse,
  buildV3DepositTransactionResponse,
  buildV3RepayTransactionResponse,
  buildV3WithdrawTransactionResponse,
} = httpModule;

async function getFirstPosition() {
  resetV3AdapterForTests();
  const adapter = getServerV3Adapter();
  const [position] = await adapter.getPositions(OWNER_ADDRESS);

  return position;
}

test('buildV3DepositTransactionResponse returns a V3 send transaction payload', async () => {
  const response = await buildV3DepositTransactionResponse(
    new URLSearchParams({
      recipient: OWNER_ADDRESS,
      amount: '1.5',
    }),
  );

  assert.equal(response.chainId, 'eip155:11155111');
  assert.equal(response.method, 'eth_sendTransaction');
  assert.equal(response.params.to, ALCHEMIST_ADDRESS);
  assert.equal(response.params.data, '0x');
  assert.equal(response.params.value, '0');
});

test('buildV3WithdrawTransactionResponse validates ownership and returns a payload', async () => {
  const position = await getFirstPosition();
  const response = await buildV3WithdrawTransactionResponse(
    new URLSearchParams({
      owner: OWNER_ADDRESS,
      recipient: ALT_RECIPIENT,
      tokenId: position.tokenId.toString(),
      amount: '0.25',
    }),
  );

  assert.equal(response.chainId, 'eip155:11155111');
  assert.equal(response.params.to, ALCHEMIST_ADDRESS);
  assert.equal(response.params.data, '0x');
});

test('buildV3BorrowTransactionResponse rejects amounts above available credit', async () => {
  const position = await getFirstPosition();

  await assert.rejects(
    () =>
      buildV3BorrowTransactionResponse(
        new URLSearchParams({
          owner: OWNER_ADDRESS,
          recipient: OWNER_ADDRESS,
          tokenId: position.tokenId.toString(),
          amount: '999999',
        }),
      ),
    /Borrow amount exceeds the selected position available credit/,
  );
});

test('buildV3RepayTransactionResponse returns a payload for valid debt repayment', async () => {
  const position = await getFirstPosition();
  const response = await buildV3RepayTransactionResponse(
    new URLSearchParams({
      owner: OWNER_ADDRESS,
      tokenId: position.tokenId.toString(),
      amount: '0.10',
    }),
  );

  assert.equal(response.chainId, 'eip155:11155111');
  assert.equal(response.params.to, ALCHEMIST_ADDRESS);
  assert.equal(response.params.data, '0x');
});

test('buildV3BurnTransactionResponse rejects amounts above current debt', async () => {
  const position = await getFirstPosition();

  await assert.rejects(
    () =>
      buildV3BurnTransactionResponse(
        new URLSearchParams({
          owner: OWNER_ADDRESS,
          tokenId: position.tokenId.toString(),
          amount: '999999',
        }),
      ),
    /Burn amount exceeds the selected position debt/,
  );
});

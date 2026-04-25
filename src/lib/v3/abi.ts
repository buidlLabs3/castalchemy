/**
 * ABI fragments for the official AlchemistV3 contract.
 * Source: alchemix-finance/v3 — src/interfaces/IAlchemistV3.sol
 */

// ─── Read-only functions ────────────────────────────────────────────
export const alchemistV3ReadAbi = [
  {
    name: 'getCDP',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'collateral', type: 'uint256' },
      { name: 'debt', type: 'uint256' },
      { name: 'earmarked', type: 'uint256' },
    ],
  },
  {
    name: 'totalValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'value', type: 'uint256' }],
  },
  {
    name: 'getMaxBorrowable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'maxDebt', type: 'uint256' }],
  },
  {
    name: 'getMaxWithdrawable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'maxWithdraw', type: 'uint256' }],
  },
  {
    name: 'getTotalDeposited',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
  {
    name: 'getTotalUnderlyingValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'TVL', type: 'uint256' }],
  },
  // ─── Protocol state views ───────────────────────────────────────
  {
    name: 'minimumCollateralization',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'minimumCollateralization', type: 'uint256' }],
  },
  {
    name: 'globalMinimumCollateralization',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'globalMinimumCollateralization', type: 'uint256' }],
  },
  {
    name: 'depositsPaused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'isPaused', type: 'bool' }],
  },
  {
    name: 'loansPaused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'isPaused', type: 'bool' }],
  },
  {
    name: 'depositCap',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'cap', type: 'uint256' }],
  },
  {
    name: 'totalDebt',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'debt', type: 'uint256' }],
  },
  // ─── Token metadata views ──────────────────────────────────────
  {
    name: 'debtToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'underlyingToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'token', type: 'address' }],
  },
  {
    name: 'myt',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'token', type: 'address' }],
  },
  // ─── Conversion helpers ────────────────────────────────────────
  {
    name: 'convertYieldTokensToDebt',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertYieldTokensToUnderlying',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertDebtTokensToYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'convertUnderlyingTokensToYield',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ─── Misc getters ─────────────────────────────────────────────
  {
    name: 'protocolFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'fee', type: 'uint256' }],
  },
  {
    name: 'liquidatorFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'fee', type: 'uint256' }],
  },
  {
    name: 'version',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'alchemistPositionNFT',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'nftContract', type: 'address' }],
  },
  {
    name: 'mintAllowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'ownerTokenId', type: 'uint256' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'allowance', type: 'uint256' }],
  },
] as const;

// ─── Write functions ────────────────────────────────────────────────
export const alchemistV3WriteAbi = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'recipientId', type: 'uint256' },
    ],
    outputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'debtValue', type: 'uint256' },
    ],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [{ name: 'amountWithdrawn', type: 'uint256' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'burn',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipientId', type: 'uint256' },
    ],
    outputs: [{ name: 'amountBurned', type: 'uint256' }],
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'recipientTokenId', type: 'uint256' },
    ],
    outputs: [{ name: 'amountRepaid', type: 'uint256' }],
  },
  {
    name: 'selfLiquidate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'accountId', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: 'amountLiquidated', type: 'uint256' }],
  },
  {
    name: 'poke',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'approveMint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// ─── Position NFT (ERC-721 Enumerable) ──────────────────────────────
export const alchemistV3PositionNftAbi = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }],
  },
] as const;

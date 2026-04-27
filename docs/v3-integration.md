# Alchemix V3 Integration Guide

> CastAlchemy's integration with the official Alchemix V3 protocol

## Status

**V3 contracts are live and verified on Ethereum mainnet.**

| Contract | Address | Etherscan |
|----------|---------|-----------|
| VaultV2Factory | `0xdd56b00302e91c4c2b8246156bdeaa1cedc58984` | [Verified](https://etherscan.io/address/0xdd56b00302e91c4c2b8246156bdeaa1cedc58984) |
| VaultV2 (USDC) | `0x9b44efca3e2a707b63dc00ce79d646e5e5d24ba5` | [Verified](https://etherscan.io/address/0x9b44efca3e2a707b63dc00ce79d646e5e5d24ba5) |
| VaultV2 (WETH) | `0x29bcfed246ce37319d94eba107db90c453d4c43d` | [Verified, $6.2M+ TVL](https://etherscan.io/address/0x29bcfed246ce37319d94eba107db90c453d4c43d) |
| AlchemistCurator | `0x7d61e3cde8b58c4be192a7a35e9d626c419302a4` | [Verified](https://etherscan.io/address/0x7d61e3cde8b58c4be192a7a35e9d626c419302a4) |
| StrategyClassifier | `0xdb7d25b0bfd1585a797f6bf7d7ccba26e77253cc` | [Verified](https://etherscan.io/address/0xdb7d25b0bfd1585a797f6bf7d7ccba26e77253cc) |

Source: [alchemix-finance/v3](https://github.com/alchemix-finance/v3) broadcast files.

---

## Architecture

### Adapter Pattern

```
V3Adapter (interface)
├── ContractV3Adapter  — live on-chain interaction via viem
└── MockV3Adapter      — deterministic mock data for dev/preview
```

Selection is controlled by `NEXT_PUBLIC_ALCHEMIX_V3_MODE`:
- `mock` → `MockV3Adapter` (default, no RPC required)
- `contracts` → `ContractV3Adapter` (requires configured RPC + addresses)

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/v3/abi.ts` | Official IAlchemistV3 ABI fragments (24 read + 8 write functions) |
| `src/lib/v3/types.ts` | TypeScript interfaces for positions, protocol state, and transaction params |
| `src/lib/v3/adapter.ts` | Adapter factory + `ContractV3Adapter` implementation |
| `src/lib/v3/mock.ts` | `MockV3Adapter` with deterministic position data |
| `src/lib/v3/config.ts` | Environment-driven config + known deployment addresses |
| `src/lib/v3/hooks.ts` | React hooks: `useV3Positions`, `useV3Position` |
| `src/lib/v3/server.ts` | Server-side helpers for Frog frame transaction prep |

---

## ABI Surface

### Read Functions (24)

| Function | Returns | Notes |
|----------|---------|-------|
| `getCDP(tokenId)` | `(collateral, debt, earmarked)` | Core position state |
| `totalValue(tokenId)` | `(value)` | Collateral value in debt-denominated terms |
| `getMaxBorrowable(tokenId)` | `(maxDebt)` | Maximum debt this position can support |
| `getMaxWithdrawable(tokenId)` | `(maxWithdraw)` | Maximum safe withdrawal amount |
| `getTotalDeposited()` | `(amount)` | Protocol-wide total deposits |
| `getTotalUnderlyingValue()` | `(TVL)` | Protocol-wide TVL |
| `minimumCollateralization()` | `(ratio)` | Per-position minimum collateralization |
| `globalMinimumCollateralization()` | `(ratio)` | Protocol-wide minimum |
| `depositsPaused()` | `(bool)` | Whether deposits are paused |
| `loansPaused()` | `(bool)` | Whether minting/loans are paused |
| `depositCap()` | `(cap)` | Maximum deposit amount |
| `totalDebt()` | `(debt)` | Protocol-wide total debt |
| `debtToken()` | `(address)` | alUSD/alETH address |
| `underlyingToken()` | `(address)` | USDC/WETH address |
| `myt()` | `(address)` | Meta-Yield Token address |
| `convertYieldTokensToDebt(amount)` | `(amount)` | Conversion helper |
| `convertYieldTokensToUnderlying(amount)` | `(amount)` | Conversion helper |
| `convertDebtTokensToYield(amount)` | `(amount)` | Conversion helper |
| `convertUnderlyingTokensToYield(amount)` | `(amount)` | Conversion helper |
| `protocolFee()` | `(fee)` | Current protocol fee |
| `liquidatorFee()` | `(fee)` | Current liquidator fee |
| `version()` | `(string)` | Contract version |
| `alchemistPositionNFT()` | `(address)` | Position NFT contract |
| `mintAllowance(tokenId, spender)` | `(allowance)` | Mint delegation |

### Write Functions (8)

| Function | Outputs | Notes |
|----------|---------|-------|
| `deposit(amount, recipient, recipientId)` | `(tokenId, debtValue)` | Creates or adds to position |
| `withdraw(amount, recipient, tokenId)` | `(amountWithdrawn)` | Withdraw collateral |
| `mint(tokenId, amount, recipient)` | — | Borrow against position |
| `burn(amount, recipientId)` | `(amountBurned)` | Burn debt tokens |
| `repay(amount, recipientTokenId)` | `(amountRepaid)` | Repay with underlying |
| `selfLiquidate(accountId, recipient)` | `(amountLiquidated)` | **NEW** — close debt using own collateral |
| `poke(tokenId)` | — | Force harvest/accrue for position |
| `approveMint(tokenId, spender, amount)` | — | Delegate mint allowance |

---

## Configuration

### Environment Variables

```bash
# Feature flag
NEXT_PUBLIC_ENABLE_ALCHEMIX_V3=true

# Adapter mode
NEXT_PUBLIC_ALCHEMIX_V3_MODE=contracts    # or "mock"

# Chain config
NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID=1
NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL=https://eth.llamarpc.com

# Contract addresses (must all be set for contracts mode)
NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMIX_V3_POSITION_NFT_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMIX_V3_TRANSMUTER_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMIX_V3_DEBT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMIX_V3_UNDERLYING_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_ALCHEMIX_V3_MYT_ADDRESS=0x...
```

### Multi-Chain Support

The adapter supports any EVM chain. Known deployments are stored in `config.ts`:
- **Chain 1** — Ethereum Mainnet (primary)
- **Chain 42161** — Arbitrum (planned)
- **Chain 10** — Optimism (planned)

---

## UI Features

### V3 Builder Page (`/miniapp/v3`)

Six action cards:
1. **Deposit** — create new position or add to existing
2. **Withdraw** — withdraw up to `maxWithdrawable` (LTV-safe)
3. **Borrow** — mint debt tokens against available credit
4. **Repay** — repay with underlying token
5. **Burn** — burn debt tokens
6. **Self-Liquidate** — close debt using own collateral, receive remaining

### Dashboard (`/miniapp`)

- **Protocol state panel** — shows operational status, total deposited, TVL, total debt, deposit cap
- **Position preview** — collateral, debt, earmarked, available credit, max withdrawable, health factor
- **Pause banners** — automatic alerts when deposits or loans are paused

### Dynamic Elements

- Chain-aware Etherscan links (mainnet/Arbitrum/Optimism/Sepolia)
- Network badge adapts to configured chain
- Protocol state fetched on mount when V3 is enabled

---

## Safety Features

- **maxWithdrawable** — withdraw limit uses on-chain `getMaxWithdrawable()` instead of raw collateral, respecting LTV constraints
- **Protocol pause detection** — UI checks `depositsPaused()` and `loansPaused()` on mount
- **Input validation** — all amounts validated client-side before transaction preparation
- **Feature gating** — entire V3 surface behind `NEXT_PUBLIC_ENABLE_ALCHEMIX_V3` flag

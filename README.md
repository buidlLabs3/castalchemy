# CastAlchemy

Alchemix V3 on Farcaster: a Mini App and Frame surface for wallet connection,
position visibility, and transaction preparation.

## Supported Networks

- Ethereum Mainnet (`1`) for production.
- Sepolia (`11155111`) for testing.

The wallet config, frame transaction helpers, and V3 adapter are intentionally
limited to those two networks.

## App Surfaces

- `/miniapp` - focused dashboard for wallet state, protocol state, and position health.
- `/miniapp/v3` - V3 transaction builder for deposit, withdraw, borrow, repay, burn, and self-liquidation.
- `/miniapp/analytics` - read-only market and automation previews.
- `/miniapp/learn` - curated V3 education path.
- `/miniapp/social` - referral and tip-intent growth tools, separated from the core transaction flow.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run type-check
npm run test:unit
```

## Configuration

Copy `env.example`, then set `NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL` and every
`NEXT_PUBLIC_ALCHEMIX_V3_*` contract address for your target chain (mainnet or
Sepolia). Reads, transaction preparation, and the Mini App require a complete
configuration; there is no offline mock adapter.

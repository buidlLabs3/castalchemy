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

### Sepolia (testnet transactions)

1. Set `NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID=11155111`.
2. Set `NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL` to a Sepolia HTTPS RPC (same value as `SEPOLIA_RPC_URL` is fine).
3. Fill every `NEXT_PUBLIC_ALCHEMIX_V3_*` address with **Sepolia** Alchemix V3 deployments (not mainnet).
4. Deploy the same env to Vercel (Project → Settings → Environment Variables) for Preview and/or Production.

### Testing Frames on Farcaster

Frames are served from this app under **`/api`** (Frog `basePath`). After deploy:

- **Frame entry:** `https://<your-host>/api/frames` (root hub with buttons to Deposit, Analytics, Learn, Positions).
- **Direct links:** e.g. `https://<your-host>/api/frames/deposit` — use your real deployment URL (Vercel preview or custom domain).
- Set **`NEXT_PUBLIC_APP_URL`** to that same `https://…` origin so Cast Action and metadata links match where Warpcast loads the app.
- In Warpcast, paste the frame URL in a cast or use [Warpcast Developer](https://warpcast.com/~/developers) flows to validate the embed.
- Transaction buttons require a wallet on the **same chain** as `NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID` (Sepolia for testnet).

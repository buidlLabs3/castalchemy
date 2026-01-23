# Quick Start Guide

## Installation

```bash
cd castalchemy
npm install
```

## Development

1. **Copy environment variables:**
   ```bash
   cp env.example .env.local
   ```

2. **Update `.env.local` with:**
   - Alchemix V2 contract addresses (testnet)
   - RPC endpoints
   - Farcaster Hub URL

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test locally:**
   - Visit `http://localhost:3000`
   - Test Frame: `http://localhost:3000/api/frames`
   - Health check: `http://localhost:3000/api/health`

## Testing Frames

1. **Main Frame:**
   - URL: `http://localhost:3000/api/frames`
   - Should show CastAlchemy welcome screen with Deposit and My Positions buttons

2. **Deposit Frame:**
   - Click "Deposit" button
   - Select vault (alUSD or alETH)
   - Enter amount
   - Transaction button will prepare deposit

3. **Dashboard Frame:**
   - Click "My Positions" button
   - Shows user positions (requires wallet connection)

## Build for Production

```bash
npm run build
npm start
```

## Type Checking

```bash
npm run type-check
```

## Linting

```bash
npm run lint
```

## Next Steps

1. Get Alchemix V2 contract addresses and ABIs
2. Update contract addresses in `.env.local`
3. Test with real contracts on testnet
4. Deploy to Vercel or similar platform
5. Test Frame flows end-to-end


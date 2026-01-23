# Deployment Guide

## Testnet Deployment (Milestone 1)

### Prerequisites
- Node.js 18+
- Vercel account (recommended) or similar hosting
- Environment variables configured

### Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `env.example` to `.env.local`
   - Fill in all required values:
     - Farcaster Hub URL
     - RPC endpoints for testnet
     - Alchemix V2 contract addresses (testnet)

3. **Build and Test Locally**
   ```bash
   npm run build
   npm run dev
   ```

4. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

   Or connect your GitHub repo to Vercel for automatic deployments.

5. **Verify Deployment**
   - Check health endpoint: `https://your-domain.com/api/health`
   - Test Frame: `https://your-domain.com/api/frames`

### Monitoring

- Health checks: `/api/health`
- Frame response times should be <2s (M1 KPI)
- Monitor transaction failures via logs

### Environment Variables

Required for testnet:
- `FARCASTER_HUB_URL`
- `SEPOLIA_RPC_URL` or `BASE_SEPOLIA_RPC_URL`
- `ALUSD_VAULT_ADDRESS` (testnet)
- `ALETH_VAULT_ADDRESS` (testnet)
- `USE_TESTNET=true`

## Production Deployment (Milestone 5)

Additional requirements:
- Mainnet RPC endpoints
- Production contract addresses
- Monitoring service integration (Sentry, DataDog, etc.)
- Incident response playbook
- 99.9% uptime target


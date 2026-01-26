# Quick Summary - Fix 404 & Get Contract Addresses

## 🔧 Fix 404 Error

**Problem**: Getting 404 on `http://localhost:3000/api/frames`

**Solution**: 
1. ✅ Route file is now `route.tsx` (supports JSX)
2. ⏳ **Restart server**: `npm run dev`
3. ✅ Test: `curl http://localhost:3000/api/frames`

## 📍 Exact Locations for Alchemix V2 Contract Addresses

### Best Option: Alchemix GitHub
**URL**: https://github.com/alchemix-finance/alchemix-v2-frontend

**What to look for**:
- File: `src/config/contracts.ts` or `src/constants/addresses.ts`
- Search for: "vault", "alUSD", "alETH"
- Look for mainnet addresses (chainId: 1)

### Alternative: Alchemix Docs
**URL**: https://docs.alchemix.fi/
- Look for "Contract Addresses" or "Deployments" section

### Alternative: Etherscan
**URL**: https://etherscan.io
- Search: "Alchemix V2 Vault" or "alUSD Vault"
- Find verified contracts

## 🎯 Making Frames Viewable in Farcaster

Frames work like WhatsApp/Telegram mini-apps:

1. **Deploy to Vercel** (required - frames must be public):
   - Go to https://vercel.com
   - Import `buidlLabs3/castalchemy`
   - Add environment variables
   - Deploy

2. **Create Cast in Warpcast**:
   - Post your Frame URL: `https://your-app.vercel.app/api/frames`
   - Farcaster automatically renders Frame inline
   - Users interact directly in feed

3. **Users See Frame**:
   - Frame appears in their feed
   - They click buttons
   - They sign transactions
   - All within Farcaster (no external links)

## ✅ Current Status

- ✅ Code pushed to GitHub
- ✅ Route file fixed (route.tsx)
- ⏳ Server needs restart
- ⏳ Need Alchemix contract addresses
- ⏳ Need to deploy to Vercel for public access

## 🚀 Next Steps

1. Restart server: `npm run dev`
2. Test Frame: `http://localhost:3000/api/frames`
3. Get contract addresses from Alchemix GitHub
4. Update `.env.local` with addresses
5. Deploy to Vercel
6. Create cast in Farcaster with Frame URL
7. Users can now interact with your Frame!




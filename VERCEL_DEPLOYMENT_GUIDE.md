# Vercel Deployment Guide - CastAlchemy

## Quick Deploy to Vercel (5 minutes)

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from castalchemy directory
```bash
cd castalchemy
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/org
- **Link to existing project?** → No (first time)
- **Project name?** → castalchemy (or your choice)
- **Directory?** → ./ (current directory)
- **Want to override settings?** → No

### Step 4: Configure Environment Variables

After deployment, add environment variables in Vercel dashboard or via CLI:

```bash
vercel env add ALUSD_VAULT_ADDRESS
# Paste: 0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd

vercel env add ALUSD_TOKEN_ADDRESS
# Paste: 0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9

vercel env add ALETH_VAULT_ADDRESS
# Paste: 0x062Bf725dC4cDF947aa79Ca2aaCCD4F385b13b5c

vercel env add ALETH_TOKEN_ADDRESS
# Paste: 0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6

vercel env add ETHEREUM_RPC_URL
# Paste your Ethereum RPC URL (e.g., from Infura, Alchemy, or https://eth.llamarpc.com)

vercel env add NODE_ENV
# Paste: production
```

Or set them in the Vercel dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with values for Production, Preview, and Development

### Step 5: Redeploy with environment variables
```bash
vercel --prod
```

### Step 6: Get Your Frame URL

After deployment, Vercel will give you a URL like:
```
https://castalchemy-abc123.vercel.app
```

Your Frame endpoint will be:
```
https://castalchemy-abc123.vercel.app/api/frames
```

---

## Test Your Frame on Farcaster

### Method 1: Use Warpcast Frame Validator
1. Go to: https://warpcast.com/~/developers/frames
2. Paste your Frame URL: `https://your-app.vercel.app/api/frames`
3. Click "Validate"
4. Test interactions

### Method 2: Create a Cast with Your Frame
1. Open Warpcast (app or https://warpcast.com)
2. Create a new cast
3. Paste your Frame URL
4. Publish the cast
5. Your Frame will appear embedded in the cast

---

## Quick Test Transactions on Farcaster

Once your Frame is live on Farcaster:

### 1. View Main Frame
- Users see the main CastAlchemy interface
- Buttons: "Deposit" and "My Positions"

### 2. Test Deposit Flow
1. Click "Deposit" button
2. Choose "alUSD Vault" or "alETH Vault"
3. Enter amount
4. Click "Deposit"
5. Sign transaction in wallet
6. Transaction executes on Ethereum mainnet

### 3. Test Position Dashboard
1. Click "My Positions"
2. Connect wallet (if needed)
3. View your deposits, borrows, and health factor
4. All data fetched from Alchemix mainnet contracts

---

## Important Notes for Testing

⚠️ **Mainnet Warning**: This deploys to **Ethereum mainnet** since Alchemix has no testnet deployment.

**For Testing:**
- Use **small amounts** ($10-50 worth)
- Test with a wallet you control
- Monitor transactions on Etherscan

**Safety Tips:**
- Start with alUSD vault (stablecoin, less volatile)
- Deposit small amounts first
- Test the full flow: deposit → view position → borrow (optional)
- Keep health factor above 2.0 (200% collateralization)

---

## Troubleshooting

### Frame not loading?
- Check Vercel deployment logs
- Verify environment variables are set
- Test Frame URL directly in browser (should return Frame metadata)

### Transactions failing?
- Verify contract addresses are correct
- Check wallet has sufficient balance + gas
- Ensure you've approved token spending (for alUSD vault)

### Frame not showing in Warpcast?
- Wait 1-2 minutes for Frame metadata to cache
- Try in incognito/private browser
- Verify Frame URL is publicly accessible

---

## Production Checklist

Before going live to users:

- [ ] All environment variables configured
- [ ] Contract addresses verified on Etherscan
- [ ] Test deposit transaction executed successfully
- [ ] Test position query works
- [ ] Frame renders correctly in Warpcast
- [ ] Error handling displays user-friendly messages
- [ ] Health check endpoint responds: `/api/health`
- [ ] Monitor setup (optional but recommended)

---

## Next Steps

After successful deployment:

1. **Share in Alchemix community** - Get feedback
2. **Create educational casts** - Explain how to use
3. **Monitor usage** - Track transactions and errors
4. **Iterate** - Improve UX based on feedback
5. **Start M2** - Build borrow frame, bot, and analytics

---

## Support

- Farcaster Frames Docs: https://docs.farcaster.xyz/developers/frames
- Alchemix Docs: https://alchemix-finance.gitbook.io/
- Vercel Docs: https://vercel.com/docs



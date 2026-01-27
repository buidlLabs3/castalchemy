# Deploy to Vercel

## Quick Deploy Steps

### Option 1: Using Vercel CLI (Terminal)

1. **Login to Vercel** (if not already logged in):
   ```bash
   vercel login
   ```
   - This will open a browser or prompt for email
   - Follow the authentication steps

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow the prompts:
     - Link to existing project? (No for first deploy)
     - Project name: `castalchemy` (or your choice)
     - Directory: `./` (current directory)
     - Override settings? (No)

3. **Set Environment Variables**:
   After deployment, go to Vercel Dashboard:
   - Project Settings → Environment Variables
   - Add all variables from `.env.local`:
     - `FARCASTER_HUB_URL`
     - `ETHEREUM_RPC_URL`
     - `BASE_RPC_URL`
     - `OPTIMISM_RPC_URL`
     - `SEPOLIA_RPC_URL`
     - `BASE_SEPOLIA_RPC_URL`
     - `ALUSD_VAULT_ADDRESS`
     - `ALUSD_TOKEN_ADDRESS`
     - `ALETH_VAULT_ADDRESS`
     - `ALETH_TOKEN_ADDRESS`
     - `NODE_ENV=production`
     - `USE_TESTNET=true` (or false for mainnet)

4. **Redeploy** after adding environment variables:
   ```bash
   vercel --prod
   ```

### Option 2: Using Vercel Dashboard (Web)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `buidlLabs3/castalchemy` repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Add Environment Variables (same as above)
7. Click "Deploy"

## Post-Deployment

After deployment, you'll get a URL like:
- `https://castalchemy.vercel.app`

### Test Your Frame

1. **Frame URL**: `https://your-app.vercel.app/api/frames`
2. **Test with Farcaster Frame Validator**:
   - Go to: https://warpcast.com/~/developers/frames
   - Enter your Frame URL
   - Verify it works

3. **Share on Farcaster**:
   - Post the Frame URL in Warpcast
   - Users can interact with your Frame directly

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Environment variables not working**: Make sure they're set for "Production" environment
- **Frame not loading**: Verify the URL is accessible and returns 200 status




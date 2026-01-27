# Farcaster Frame Setup & Transaction Guide

## 🎯 Quick Start

Your server is running at: **http://localhost:3000**

## 📍 Frame URLs

### For Local Testing:
- **Main Frame**: `http://localhost:3000/api/frames`
- **Deposit Frame**: `http://localhost:3000/api/frames/deposit`
- **Dashboard Frame**: `http://localhost:3000/api/frames/dashboard`

### For Production (after deployment):
- Replace `localhost:3000` with your deployed domain
- Example: `https://your-domain.vercel.app/api/frames`

## 🚀 Accessing Frames on Farcaster

### Option 1: Frame Validator (Recommended for Testing)
1. Visit: https://warpcast.com/~/developers/frames
2. Enter your Frame URL: `http://localhost:3000/api/frames`
3. Click "Validate Frame"
4. Test all interactions

### Option 2: Create a Cast with Frame
1. In Warpcast, create a new cast
2. Add your Frame URL as a link
3. Farcaster will automatically detect and render the Frame

### Option 3: Direct Frame URL
Share this URL in any Farcaster cast:
```
http://localhost:3000/api/frames
```

## 💰 Making Transactions

### Current Transaction Flow:

1. **User clicks "Deposit" button** in Frame
2. **Selects vault** (alUSD or alETH)
3. **Enters amount** to deposit
4. **Clicks "Deposit" transaction button**
5. **Wallet prompts** for signature
6. **Transaction is sent** to blockchain

### Transaction Endpoint:
```
GET /api/transactions/deposit?vault=alUSD&amount=1000000000000000000
```

Returns transaction data in Farcaster Frame transaction format.

## 🔧 Configuration Needed

### 1. Contract Addresses
Update `.env.local` with Alchemix V2 testnet addresses:
```bash
ALUSD_VAULT_ADDRESS=0x... # Add actual address
ALETH_VAULT_ADDRESS=0x... # Add actual address
```

### 2. RPC Endpoints
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
# or
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 3. Farcaster Hub (Optional)
```bash
FARCASTER_HUB_URL=https://hubs.airstack.xyz
```

## 🧪 Testing Transactions

### Test Deposit Flow:
1. Start server: `npm run dev`
2. Open Frame: `http://localhost:3000/api/frames`
3. Click "Deposit" → Select vault → Enter amount
4. Transaction button will appear
5. Connect wallet when prompted
6. Sign transaction

### Test Transaction Endpoint Directly:
```bash
curl "http://localhost:3000/api/transactions/deposit?vault=alUSD&amount=1000000000000000000"
```

## 📱 Frame Features

### Main Frame (`/api/frames`)
- Shows CastAlchemy branding
- Two buttons: "Deposit" and "My Positions"

### Deposit Frame (`/api/frames/deposit`)
- Vault selection (alUSD/alETH)
- Amount input
- Transaction button

### Dashboard Frame (`/api/frames/dashboard`)
- Shows user positions
- Health factor display
- Refresh button

## 🔐 Wallet Connection

Frames support:
- **Coinbase Wallet**
- **Rainbow Wallet**
- **MetaMask**

Users connect their wallet when clicking transaction buttons.

## 📊 Transaction Status

After transaction:
- Frame shows "Processing..." state
- User confirms in wallet
- Transaction is submitted to blockchain
- Frame can show success/error state

## 🚨 Important Notes

1. **Local Testing**: Use `localhost:3000` for local development
2. **Production**: Deploy to Vercel/Netlify for public access
3. **Contract Addresses**: Must be configured before transactions work
4. **Testnet**: Use testnet addresses and testnet wallets
5. **Frame URL**: Must be publicly accessible for Farcaster to load

## 🎬 Next Steps

1. ✅ Server is running
2. ⏳ Test Frame in Farcaster Frame Validator
3. ⏳ Configure contract addresses
4. ⏳ Test deposit transaction flow
5. ⏳ Deploy to production (Vercel recommended)
6. ⏳ Share Frame URL in Farcaster cast

## 📞 Troubleshooting

### Frame not loading?
- Check server is running
- Verify URL is accessible
- Check Frame Validator for errors

### Transaction not working?
- Verify contract addresses in `.env.local`
- Check RPC endpoint is working
- Ensure wallet is connected

### Need help?
- Check `TROUBLESHOOTING.md`
- Review Frame Validator errors
- Check server logs





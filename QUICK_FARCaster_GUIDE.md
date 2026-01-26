# Quick Guide: Access Frames on Farcaster & Make Transactions

## ✅ Your Frame URL

**Local (for testing):**
```
http://localhost:3000/api/frames
```

**After deployment (production):**
```
https://your-domain.vercel.app/api/frames
```

## 🚀 Step 1: Test Your Frame

### Option A: Farcaster Frame Validator (Easiest)
1. Go to: https://warpcast.com/~/developers/frames
2. Paste: `http://localhost:3000/api/frames`
3. Click "Validate Frame"
4. Test all buttons and interactions

### Option B: Create a Cast
1. Open Warpcast
2. Create a new cast
3. Add your Frame URL
4. Farcaster will automatically render the Frame

## 💰 Step 2: Make Transactions

### How It Works:
1. User opens your Frame in Farcaster
2. Clicks "Deposit" button
3. Selects vault (alUSD or alETH)
4. Enters amount
5. Clicks transaction button
6. Wallet opens for signature
7. Transaction is submitted

### Current Transaction Flow:
```
Frame → Deposit → Select Vault → Enter Amount → Sign Transaction → Submit
```

## 🔧 Step 3: Configure Contracts

Before transactions work, update `.env.local`:

```bash
# Alchemix V2 Testnet Addresses
ALUSD_VAULT_ADDRESS=0x... # Get from Alchemix docs
ALETH_VAULT_ADDRESS=0x... # Get from Alchemix docs

# RPC Endpoint
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## 📱 Testing Locally

1. **Start server** (if not running):
   ```bash
   cd castalchemy
   npm run dev
   ```

2. **Test Frame endpoint**:
   ```bash
   curl http://localhost:3000/api/frames
   ```

3. **Test transaction endpoint**:
   ```bash
   curl "http://localhost:3000/api/transactions/deposit?vault=alUSD&amount=1000000000000000000"
   ```

## 🌐 Deploy for Public Access

For Farcaster to access your Frame, it must be publicly accessible:

1. **Push to GitHub**
2. **Deploy to Vercel** (free):
   - Go to vercel.com
   - Import your GitHub repo
   - Add environment variables
   - Deploy

3. **Use Vercel URL** in Farcaster:
   ```
   https://your-app.vercel.app/api/frames
   ```

## 🎯 What You Can Do Now

✅ **Test Frame locally** using Frame Validator  
✅ **View Frame UI** in browser  
✅ **Test transaction preparation** (needs contract addresses)  
⏳ **Deploy to production** for Farcaster access  
⏳ **Configure contracts** for real transactions  

## 📝 Next Steps

1. Test Frame in Farcaster Frame Validator
2. Get Alchemix V2 contract addresses
3. Update `.env.local` with addresses
4. Test transaction flow
5. Deploy to Vercel
6. Share Frame URL in Farcaster!

## 🆘 Need Help?

- Frame not loading? Check server is running
- Transaction failing? Verify contract addresses
- See `FARCASTER_SETUP.md` for detailed guide




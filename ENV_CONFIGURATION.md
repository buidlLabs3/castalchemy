# Environment Configuration Guide

## ✅ Current Configuration

The `.env.local` file has been configured with:

### ✅ Set (Ready to Use)
- **Farcaster Hub URL**: `https://hubs.airstack.xyz` (public hub)
- **RPC Endpoints**: Public RPCs (no API key needed)
  - Sepolia: `https://rpc.sepolia.org`
  - Ethereum: `https://eth.llamarpc.com`
  - Base: `https://mainnet.base.org`

### ⚠️ Needs Configuration (Contract Addresses)

The following need actual Alchemix V2 contract addresses:

```bash
ALUSD_VAULT_ADDRESS=0x... # Get from Alchemix
ALUSD_TOKEN_ADDRESS=0x... # Get from Alchemix
ALETH_VAULT_ADDRESS=0x... # Get from Alchemix
ALETH_TOKEN_ADDRESS=0x... # Get from Alchemix
```

## 🔍 Where to Get Contract Addresses

### Option 1: Alchemix Documentation
1. Visit: https://docs.alchemix.fi/
2. Look for "Contract Addresses" or "Deployments"
3. Find V2 vault addresses

### Option 2: Alchemix GitHub
1. Visit: https://github.com/alchemix-finance
2. Check `alchemix-v2-frontend` repository
3. Look in config files for addresses

### Option 3: Etherscan
1. Visit: https://etherscan.io
2. Search for "Alchemix" or "alUSD"
3. Find verified vault contracts

### Option 4: Alchemix Community
- Join Alchemix Discord
- Ask in developer channel for V2 addresses

## 🚀 For Farcaster Transactions

### Current Setup:
- ✅ Farcaster Hub configured
- ✅ RPC endpoints ready
- ⏳ Contract addresses needed

### Once Addresses are Added:

1. **Update `.env.local`** with actual addresses
2. **Restart server**: `npm run dev`
3. **Test Frame**: `http://localhost:3000/api/frames`
4. **Test Transaction**: Use Frame to initiate deposit

## 📝 Important Notes

1. **Mainnet vs Testnet**:
   - Alchemix V2 is likely on mainnet only
   - Transactions will use mainnet (real ETH)
   - Use test wallets with small amounts for testing

2. **RPC Endpoints**:
   - Currently using public RPCs (free, but rate-limited)
   - For production, get API key from Infura/Alchemy
   - Update `ETHEREUM_RPC_URL` with your API key

3. **Security**:
   - `.env.local` is in `.gitignore` (not committed)
   - Never commit API keys or private keys
   - Use environment variables in production

## 🔄 Next Steps

1. Get Alchemix V2 contract addresses
2. Update `.env.local` with addresses
3. Restart server
4. Test Frame transactions on Farcaster

## 🧪 Testing Without Contracts

You can test the Frame UI without contract addresses:
- Frame will load and show UI
- Transaction buttons will appear
- Contract calls will fail (expected until addresses are set)





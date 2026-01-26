# Where to Get Contract Addresses & RPC URLs

## 🔍 Alchemix V2 Contract Addresses

### Option 1: Alchemix Documentation (Recommended)
1. Visit: https://docs.alchemix.fi/
2. Look for "Contract Addresses" or "Deployments" section
3. Find V2 vault addresses for:
   - alUSD Vault
   - alETH Vault

### Option 2: Alchemix GitHub
1. Visit: https://github.com/alchemix-finance
2. Look for deployment files or documentation
3. Check repositories like:
   - `alchemix-v2-frontend`
   - `alchemix-v2-contracts`

### Option 3: Etherscan (Mainnet)
1. Visit: https://etherscan.io
2. Search for "Alchemix" or "alUSD"
3. Look for verified contracts
4. Check contract interactions to find vault addresses

### Option 4: Alchemix Discord/Community
1. Join Alchemix Discord
2. Ask in developer channel
3. Request testnet addresses if needed

### Testnet vs Mainnet
- **For testing**: Use testnet addresses (if available)
- **For production**: Use mainnet addresses
- **Note**: Alchemix V2 may only be on mainnet

## 🌐 RPC Endpoints (Sepolia Testnet)

### Option 1: Public RPCs (Free, No Key Needed)
```bash
# Public Sepolia RPC (no API key required)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
# or
SEPOLIA_RPC_URL=https://rpc.sepolia.org
# or
SEPOLIA_RPC_URL=https://sepolia.gateway.tenderly.co
```

### Option 2: Infura (Free Tier)
1. Visit: https://infura.io
2. Sign up for free account
3. Create new project
4. Select "Ethereum" → "Sepolia"
5. Copy your API key
6. Use: `https://sepolia.infura.io/v3/YOUR_API_KEY`

### Option 3: Alchemy (Free Tier)
1. Visit: https://www.alchemy.com
2. Sign up for free account
3. Create new app
4. Select "Ethereum" → "Sepolia"
5. Copy your API key
6. Use: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Option 4: QuickNode (Free Tier)
1. Visit: https://www.quicknode.com
2. Sign up for free account
3. Create endpoint for Sepolia
4. Copy your endpoint URL

## 📝 Quick Setup

### For Testing (Using Public RPC):
```bash
# In .env.local
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ALUSD_VAULT_ADDRESS=0x... # Get from Alchemix docs
ALETH_VAULT_ADDRESS=0x... # Get from Alchemix docs
```

### For Production (Using API Key):
```bash
# In .env.local
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# or
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ALUSD_VAULT_ADDRESS=0x... # Mainnet address
ALETH_VAULT_ADDRESS=0x... # Mainnet address
```

## 🔗 Useful Links

- **Alchemix Docs**: https://docs.alchemix.fi/
- **Alchemix GitHub**: https://github.com/alchemix-finance
- **Etherscan**: https://etherscan.io
- **Infura**: https://infura.io
- **Alchemy**: https://www.alchemy.com
- **Sepolia Faucet**: https://sepoliafaucet.com (for test ETH)

## ⚠️ Important Notes

1. **Testnet vs Mainnet**: 
   - Alchemix V2 might only be on mainnet
   - You may need to use mainnet addresses even for testing
   - Use testnet RPC for Sepolia, mainnet RPC for Ethereum mainnet

2. **RPC Rate Limits**:
   - Public RPCs have rate limits
   - Free API keys have daily limits
   - For production, consider paid plans

3. **Contract Verification**:
   - Always verify contract addresses
   - Check on Etherscan before using
   - Confirm with Alchemix team if unsure

## 🎯 Recommended Approach

1. **Start with public RPC** for testing:
   ```bash
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ```

2. **Get contract addresses** from Alchemix docs or GitHub

3. **For production**, get your own API key from Infura or Alchemy

4. **Verify addresses** on Etherscan before using




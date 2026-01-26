# Exact Locations for Alchemix V2 Contract Addresses

## 🎯 Where to Get Contract Addresses

### Option 1: Alchemix Official Documentation (BEST)
**URL**: https://docs.alchemix.fi/

**Steps**:
1. Go to https://docs.alchemix.fi/
2. Look for "Contract Addresses" section
3. Or search for "V2" or "deployments"
4. Find mainnet addresses for:
   - alUSD Vault
   - alETH Vault
   - alUSD Token
   - alETH Token

### Option 2: Alchemix GitHub Repository (MOST RELIABLE)
**URL**: https://github.com/alchemix-finance/alchemix-v2-frontend

**Steps**:
1. Visit: https://github.com/alchemix-finance/alchemix-v2-frontend
2. Look in these files:
   - `src/config/contracts.ts` or similar
   - `src/constants/addresses.ts`
   - `config/` directory
   - `constants/` directory
3. Search for "vault" or "alUSD" or "alETH"

**Alternative Repos to Check**:
- https://github.com/alchemix-finance/alchemix-v2-contracts
- https://github.com/alchemix-finance/alchemix-protocol

### Option 3: Etherscan (VERIFIED CONTRACTS)
**URL**: https://etherscan.io

**Steps**:
1. Go to https://etherscan.io
2. Search for "Alchemix" or "alUSD"
3. Look for verified contracts
4. Check contract interactions to find vault addresses
5. Look for "Vault" or "Transmuter" contracts

**Direct Search**:
- Search: "Alchemix V2 Vault"
- Search: "alUSD Vault"
- Search: "alETH Vault"

### Option 4: Alchemix Discord/Community
1. Join Alchemix Discord
2. Ask in #developers or #technical channel
3. Request: "Alchemix V2 mainnet contract addresses for alUSD and alETH vaults"

### Option 5: Alchemix Website/App
1. Visit: https://app.alchemix.fi
2. Open browser DevTools (F12)
3. Check Network tab
4. Look for API calls that return contract addresses
5. Or check localStorage/sessionStorage for config

## 📝 Expected Address Format

Contract addresses should look like:
```
0x1234567890123456789012345678901234567890
```

## 🔍 Quick Search Commands

If you have the GitHub repo cloned:
```bash
# Search for vault addresses
grep -r "vault" --include="*.ts" --include="*.js" | grep -i "address"
grep -r "alUSD" --include="*.ts" --include="*.js" | grep -i "0x"
```

## ⚠️ Important Notes

1. **Mainnet Only**: Alchemix V2 is likely only on mainnet (not testnet)
2. **Verify Addresses**: Always verify on Etherscan before using
3. **Token vs Vault**: 
   - `ALUSD_TOKEN_ADDRESS` = The alUSD token contract
   - `ALUSD_VAULT_ADDRESS` = The vault where you deposit/borrow
4. **Network**: All addresses are on Ethereum mainnet (chainId: 1)

## 🚀 Once You Have Addresses

Update `.env.local`:
```bash
ALUSD_VAULT_ADDRESS=0x... # Paste actual address
ALUSD_TOKEN_ADDRESS=0x... # Paste actual address
ALETH_VAULT_ADDRESS=0x... # Paste actual address
ALETH_TOKEN_ADDRESS=0x... # Paste actual address
```

Then restart your server!


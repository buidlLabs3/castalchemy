# Next Steps for Milestone 1

## ✅ Completed

1. **Project Structure** - Complete
   - Next.js 14 with TypeScript
   - Clean architecture with separation of concerns
   - All core files created

2. **Farcaster Frames Integration** - Complete
   - Frog framework integrated
   - Main frame route
   - Deposit and Dashboard frames
   - Transaction button support

3. **Alchemix V2 Contract Layer** - Complete
   - Contract client abstraction
   - Read/write operations
   - Network configuration

4. **Error Handling & Monitoring** - Complete
   - Custom error classes
   - Health check endpoint
   - Monitoring utilities

## 🔄 Immediate Next Steps

### 1. Install Dependencies
```bash
cd castalchemy
npm install
```

**Note:** If you encounter network timeouts, try:
- Using a different network
- Using `npm install --legacy-peer-deps`
- Installing dependencies one by one

### 2. Get Alchemix Contract Information

You need to obtain:
- **Alchemix V2 testnet contract addresses** for:
  - alUSD vault
  - alETH vault
  - Token addresses

- **Full contract ABIs** (replace minimal ABIs in `src/lib/contracts/alchemix.ts`)

**Where to get them:**
- Alchemix documentation
- Alchemix GitHub repository
- Etherscan (for verified contracts)
- Alchemix team directly

### 3. Configure Environment Variables

Create `.env.local` from `env.example`:
```bash
cp env.example .env.local
```

Update with:
- Alchemix V2 contract addresses (testnet)
- RPC endpoints (Sepolia or Base Sepolia)
- Farcaster Hub URL

### 4. Test Locally

```bash
npm run dev
```

Test endpoints:
- Main page: `http://localhost:3000`
- Frame: `http://localhost:3000/api/frames`
- Health: `http://localhost:3000/api/health`

### 5. Fix Any Type/Compilation Errors

Run type checking:
```bash
npm run type-check
```

Fix any TypeScript errors that appear.

### 6. Test Frame Flows

1. Test main frame loads correctly
2. Test deposit frame navigation
3. Test dashboard frame (will need wallet connection)
4. Test transaction preparation endpoints

### 7. Deploy to Testnet

Follow `DEPLOYMENT.md`:
- Deploy to Vercel or similar
- Configure environment variables in deployment
- Test Frame URLs work on testnet
- Verify health checks

### 8. Perform Test Transactions

M1 KPI: **20+ test transactions**
- Test deposits to alUSD vault
- Test deposits to alETH vault
- Verify transactions appear correctly
- Test error handling

### 9. Performance Testing

M1 KPI: **Sub-2s load time**
- Measure frame response times
- Optimize if needed
- Add caching if necessary

### 10. Documentation

- Update README with actual contract addresses
- Document any issues found
- Create testnet deployment guide

## 📋 Milestone 1 Acceptance Criteria

- ✅ 3 working Frames on testnet
- ⏳ 20+ test transactions
- ⏳ Sub-2s load time
- ⏳ Demonstrable Frame flows on testnet
- ✅ Documented setup steps
- ✅ Basic monitoring for errors

## 🚨 Blockers

1. **Contract Addresses** - Need Alchemix V2 testnet addresses
2. **Contract ABIs** - Need full, audited ABIs
3. **Dependencies** - npm install needs to complete (network issue)

## 💡 Tips

- Start with testnet contracts only
- Use mock data if contracts aren't available yet
- Test Frame UI/UX flows first, then add real contract calls
- Use Farcaster Frame validator to test Frame metadata

## 📞 Questions to Resolve

From `docs/open-questions.md`:
- Confirm testnet networks (Sepolia, Base Sepolia, etc.)
- Get contract addresses and ABIs
- Confirm RPC endpoints to use


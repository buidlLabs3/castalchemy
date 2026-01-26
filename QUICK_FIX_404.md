# Fix 404 Error on /api/frames

## ✅ Fixed
- Route file renamed to `route.tsx` (supports JSX)
- Next.js config updated

## 🔄 Action Required: Restart Server

The server needs to be restarted to pick up the `.tsx` file:

```bash
cd castalchemy
npm run dev
```

## ✅ After Restart

Test the Frame:
```bash
curl http://localhost:3000/api/frames
```

Should return Frame metadata (not 404).

## 📍 Exact Locations for Contract Addresses

See `ALCHEMIX_CONTRACT_ADDRESSES.md` for detailed guide.

**Quick Links**:
1. **Alchemix Docs**: https://docs.alchemix.fi/
2. **Alchemix GitHub**: https://github.com/alchemix-finance/alchemix-v2-frontend
3. **Etherscan**: https://etherscan.io (search "Alchemix")

## 🎯 Making Frames Viewable in Farcaster

See `FARCASTER_VIEWABLE_GUIDE.md` for complete guide.

**Quick Summary**:
1. Deploy to Vercel (frames must be publicly accessible)
2. Create a cast in Warpcast with your Frame URL
3. Farcaster automatically renders the Frame inline
4. Users interact directly in the feed (like WhatsApp/Telegram apps)




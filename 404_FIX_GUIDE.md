# Fix 404 Error on /api/frames

## ✅ What's Been Fixed

1. ✅ Removed duplicate `route.tsx` file
2. ✅ Removed `basePath` from Frog config (causes conflicts)
3. ✅ Cleared `.next` cache
4. ✅ Simplified route without JSX imports

## 🔄 **CRITICAL: Restart Server**

After clearing cache, **you MUST restart the server**:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Test After Restart

```bash
# Test GET request
curl http://localhost:3000/api/frames

# Test POST request (what Farcaster uses)
curl -X POST http://localhost:3000/api/frames
```

## 🔍 If Still 404 After Restart

### Check 1: Verify Route File Exists
```bash
ls -la src/app/api/frames/route.ts
# Should show: route.ts (not route.tsx)
```

### Check 2: Check for Compilation Errors
Look in terminal where `npm run dev` is running for:
- TypeScript errors
- Import errors
- Module not found errors

### Check 3: Verify Frog Version
```bash
cat package.json | grep frog
# Should show: "frog": "^0.18.3"
```

### Check 4: Test Other Routes
```bash
curl http://localhost:3000/api/test
# Should return: {"status":"ok","message":"Server is working"}
```

If `/api/test` works but `/api/frames` doesn't, the issue is with Frog setup.

## 🐛 Common Issues

### Issue: "Module not found: Can't resolve 'frog'"
**Fix**: 
```bash
npm install frog@^0.18.3
```

### Issue: TypeScript errors in route.ts
**Fix**: Check that all imports are correct:
```typescript
import { Frog } from 'frog';
import { handle } from 'frog/next';
```

### Issue: Server compiles but returns 404
**Fix**: 
1. Clear cache: `rm -rf .next`
2. Restart server: `npm run dev`
3. Wait for "Ready" message
4. Test again

## 📋 Current Route File Structure

```
src/app/api/frames/
├── route.ts          ✅ (main route - should be only one)
├── route-simple.ts   (backup)
└── route.ts.bak      (old backup)
```

## ✅ Expected Response

When working, `/api/frames` should return HTML with:
- `<meta property="fc:frame">` tags
- Frame image URL
- Button intents

If you see HTML with meta tags, **it's working!** ✅




# Server Crash Fix - SIGBUS Error

## Problem
Server starts but crashes immediately with SIGBUS error during compilation. This is a memory/binary corruption issue with esbuild.

## Root Cause
- SIGBUS = Memory access violation
- Likely corrupted esbuild binary in node_modules
- Next.js build worker crashes during compilation

## Solutions to Try

### Solution 1: Reinstall esbuild (Recommended)
```bash
cd castalchemy
rm -rf node_modules/esbuild
npm install esbuild@latest --legacy-peer-deps
npm run dev
```

### Solution 2: Full Clean Reinstall
```bash
cd castalchemy
rm -rf node_modules package-lock.json .next
npm cache clean --force
npm install --legacy-peer-deps
npm run dev
```

### Solution 3: Use Different Node Version
The issue might be Node.js 18.19.1 compatibility. Try:
```bash
# If you have nvm
nvm install 20
nvm use 20
npm run dev
```

### Solution 4: Skip Type Checking Temporarily
```bash
cd castalchemy
NEXT_SKIP_TYPE_CHECK=true npm run dev
```

### Solution 5: Use Standalone Build
```bash
cd castalchemy
npm run build -- --standalone
npm start
```

## Quick Test
Test if basic Next.js works without Frog:
```bash
# Temporarily rename the frames route
mv src/app/api/frames/route.ts src/app/api/frames/route.ts.bak
npm run dev
# If this works, the issue is with Frog framework compilation
```

## Alternative: Use Vercel or Cloud Deployment
Since local compilation is failing, consider:
1. Push to GitHub
2. Deploy to Vercel (free)
3. Vercel handles the build process

## Current Status
- ✅ Dependencies installed
- ✅ Code is complete
- ❌ Local compilation failing (SIGBUS)
- ⏳ Need to fix esbuild/compilation issue

## Next Steps
1. Try Solution 1 (reinstall esbuild)
2. If that fails, try Solution 2 (full reinstall)
3. If still failing, consider deploying to Vercel instead




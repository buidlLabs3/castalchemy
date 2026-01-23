# Troubleshooting Server Issues

## Issue: Server Crashes or Hangs

The server appears to start but then crashes or hangs. This is likely due to:

1. **SIGBUS Error** - Memory access issue during compilation
2. **Frog Framework** - ES Module compatibility
3. **TypeScript/JSX** - Compilation errors

## Quick Fixes

### 1. Clear All Caches
```bash
rm -rf .next node_modules/.cache
```

### 2. Increase Node Memory
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

### 3. Check if Basic Route Works
Test: http://localhost:3000/api/test
Should return: `{"status":"ok","message":"Server is working"}`

### 4. Check Frog Framework Route
Test: http://localhost:3000/api/frames
If this crashes, the issue is with Frog/JSX compilation

## Alternative: Run Without Type Checking

If TypeScript is causing issues, you can temporarily disable strict checking:

```bash
NEXT_DISABLE_STRICT_MODE=1 npm run dev
```

## Check Server Status

```bash
# Check if port is in use
lsof -ti:3000

# Check server process
ps aux | grep "next dev"
```

## Next Steps

1. Test basic route: `/api/test`
2. If that works, test Frame route: `/api/frames`
3. Check browser console for errors
4. Check terminal for compilation errors


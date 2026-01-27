#!/bin/bash
# CastAlchemy - Quick Deployment Script
# Run this to deploy to Vercel in one command

set -e

echo "🚀 CastAlchemy Deployment Script"
echo "================================"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in castalchemy directory"
    echo "Run: cd /home/core/Desktop/alchemix/castalchemy"
    exit 1
fi

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy
echo "🚀 Deploying to Vercel..."
echo ""
echo "When prompted:"
echo "  - Set up and deploy? → Yes"
echo "  - Which scope? → Your account"
echo "  - Link to existing project? → No"
echo "  - Project name? → castalchemy"
echo "  - Directory? → ./"
echo "  - Override settings? → No"
echo ""

vercel

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add these variables:"
echo ""
echo "   ALUSD_VAULT_ADDRESS=0x5C6374a2ac4EBC38DeA0Fc1F8716e5Ea1AdD94dd"
echo "   ALUSD_TOKEN_ADDRESS=0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9"
echo "   ALETH_VAULT_ADDRESS=0x062Bf725dC4cDF947aa79Ca2aaCCD4F385b13b5c"
echo "   ALETH_TOKEN_ADDRESS=0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6"
echo "   ETHEREUM_RPC_URL=https://eth.llamarpc.com"
echo "   NODE_ENV=production"
echo ""
echo "5. Run: vercel --prod"
echo ""
echo "🎉 Your Frame will be live at: https://your-project.vercel.app/api/frames"
echo ""
echo "📖 See QUICK_DEPLOY.md for detailed instructions"


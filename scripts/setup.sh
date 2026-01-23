#!/bin/bash
# Setup script for CastAlchemy

set -e

echo "⚗️  CastAlchemy Setup"
echo "===================="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
if npm install --legacy-peer-deps; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependency installation had issues. You may need to retry."
fi

# Type check
echo ""
echo "🔍 Running type check..."
if npm run type-check 2>&1 | grep -q "error"; then
    echo "⚠️  Type errors found. Review and fix before proceeding."
else
    echo "✅ Type check passed"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with contract addresses and RPC endpoints"
echo "2. Run 'npm run dev' to start development server"
echo "3. Test Frame endpoints at http://localhost:3000/api/frames"


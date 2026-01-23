# CastAlchemy

Alchemix on Farcaster - Self-repaying loans via Frames, Cast Actions, and bots.

## Overview

CastAlchemy brings Alchemix's self-repaying loan protocol to Farcaster, enabling users to deposit, borrow, and manage positions natively within their feed.

## Milestones

See `docs/milestones.md` for detailed milestone breakdown.

### Milestone 1 (Current)
- Farcaster Frames SDK integration
- Alchemix V2 contract layer (alUSD, alETH)
- Deposit Frame
- Position Dashboard Frame
- Wallet connections (Coinbase, Rainbow, MetaMask)
- Transaction signing & error handling
- Testnet deployment

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## Project Structure

```
castalchemy/
├── src/
│   ├── app/              # Next.js app router
│   ├── lib/              # Core libraries
│   │   ├── contracts/    # Alchemix contract interfaces
│   │   ├── frames/       # Frame handlers
│   │   └── utils/        # Utilities
│   └── types/            # TypeScript types
├── docs/                 # Documentation
└── public/               # Static assets
```

## License

MIT


/**
 * Wallet configuration for Farcaster + WalletConnect
 * Network: Sepolia Testnet (for safe testing)
 */
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '471d16ca38bb523b158cef3957cbfa7d';

// Use multiple RPC endpoints for redundancy
const sepoliaRpcUrls = [
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia.publicnode.com',
  'https://sepolia.gateway.tenderly.co',
  'https://rpc2.sepolia.org',
];

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(sepoliaRpcUrls[0], {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export { sepolia };
export const NETWORK = 'sepolia';
export const CHAIN_ID = 11155111;

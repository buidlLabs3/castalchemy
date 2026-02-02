/**
 * Wallet configuration for Farcaster + WalletConnect
 * Network: Sepolia Testnet (for safe testing)
 */
import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [sepolia.id]: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'),
  },
});

export { sepolia };
export const NETWORK = 'sepolia';

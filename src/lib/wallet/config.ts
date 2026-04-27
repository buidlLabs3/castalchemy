/**
 * Wallet configuration for Farcaster + WalletConnect
 * Supports Ethereum Mainnet (V3 production) and Sepolia (testing).
 */
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, arbitrum, optimism } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '471d16ca38bb523b158cef3957cbfa7d';

// Primary chain is determined by V3 config
const v3ChainId = Number(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID || '1');

export const config = createConfig({
  chains: [mainnet, arbitrum, optimism, sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL || 'https://eth.llamarpc.com', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [optimism.id]: http('https://mainnet.optimism.io', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
    [sepolia.id]: http('https://rpc.sepolia.org', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export { mainnet, sepolia, arbitrum, optimism };
export const V3_CHAIN_ID = v3ChainId;

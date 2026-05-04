/**
 * Wallet configuration for Farcaster + WalletConnect
 * Supports Ethereum Mainnet (production) and Sepolia (testing).
 */
import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { V3_MAINNET_CHAIN_ID, V3_TESTNET_CHAIN_ID } from '@/lib/v3/config';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '471d16ca38bb523b158cef3957cbfa7d';

// Primary chain is determined by V3 config
const configuredChainId = Number(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID || V3_MAINNET_CHAIN_ID);
const v3ChainId = configuredChainId === V3_TESTNET_CHAIN_ID ? V3_TESTNET_CHAIN_ID : V3_MAINNET_CHAIN_ID;

export const config = createConfig({
  chains: [mainnet, sepolia],
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
    [sepolia.id]: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org', {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

export { mainnet, sepolia };
export const V3_CHAIN_ID = v3ChainId;

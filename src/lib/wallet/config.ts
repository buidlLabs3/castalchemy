/**
 * Wallet configuration for Farcaster + WalletConnect
 * Supports the verified Ethereum Mainnet V3 deployment.
 */
import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { V3_MAINNET_CHAIN_ID } from '@/lib/v3/config';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '471d16ca38bb523b158cef3957cbfa7d';

const v3ChainId = V3_MAINNET_CHAIN_ID;

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_RPC_URL ||
        process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL ||
        process.env.ETHEREUM_RPC_URL ||
        'https://eth.llamarpc.com',
      {
        batch: true,
        retryCount: 3,
        retryDelay: 1000,
      },
    ),
  },
});

export { mainnet };
export const V3_CHAIN_ID = v3ChainId;

/**
 * Wallet configuration for hybrid Farcaster + WalletConnect approach
 */
import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - Get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
  },
});

export { mainnet };



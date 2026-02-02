/**
 * Minimal wagmi configuration for Farcaster wallet
 */
import { http, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet],
  connectors: [],
  transports: {
    [mainnet.id]: http(process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'),
  },
});

export { mainnet };

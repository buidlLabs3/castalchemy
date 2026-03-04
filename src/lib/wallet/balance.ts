/**
 * Custom balance fetcher for Farcaster wallet compatibility
 */
import { formatEther } from 'viem';
import type { Address } from 'viem';

interface EthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export async function fetchBalance(address: Address, provider?: EthProvider): Promise<string> {
  console.log('Fetching balance for:', address, 'with provider:', !!provider);
  
  try {
    // Try using provider first (for Farcaster or MetaMask)
    if (provider) {
      console.log('Using provider to fetch balance...');
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      console.log('Balance from provider:', balance);
      const formatted = formatEther(BigInt(balance as string));
      console.log('Formatted balance:', formatted);
      return formatted;
    }

    // Fallback to public RPC - try multiple endpoints
    const rpcUrls = [
      'https://rpc.sepolia.org',
      'https://ethereum-sepolia.publicnode.com',
      'https://sepolia.gateway.tenderly.co',
    ];

    for (const rpcUrl of rpcUrls) {
      try {
        console.log('Trying RPC:', rpcUrl);
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1,
          }),
        });

        const data = await response.json();
        console.log('RPC response:', data);
        
        if (data.result) {
          const formatted = formatEther(BigInt(data.result));
          console.log('Balance from RPC:', formatted);
          return formatted;
        }

        if (data.error) {
          console.error('RPC error:', data.error);
          continue; // Try next RPC
        }
      } catch (error) {
        console.error(`RPC ${rpcUrl} failed:`, error);
        continue; // Try next RPC
      }
    }

    throw new Error('All RPC endpoints failed');
  } catch (error) {
    console.error('Balance fetch error:', error);
    throw error;
  }
}

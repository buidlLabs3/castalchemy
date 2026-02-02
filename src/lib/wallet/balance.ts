/**
 * Custom balance fetcher for Farcaster wallet compatibility
 */
import { formatEther } from 'viem';
import type { Address } from 'viem';

interface EthProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

export async function fetchBalance(address: Address, provider?: EthProvider): Promise<string> {
  try {
    // Try using provider first (for Farcaster)
    if (provider) {
      const balance = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      return formatEther(BigInt(balance as string));
    }

    // Fallback to public RPC
    const rpcUrl = 'https://rpc.sepolia.org';
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
    if (data.result) {
      return formatEther(BigInt(data.result));
    }

    throw new Error('Failed to fetch balance');
  } catch (error) {
    console.error('Balance fetch error:', error);
    throw error;
  }
}

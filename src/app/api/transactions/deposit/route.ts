/**
 * Transaction endpoint for deposits
 * Returns transaction data for Frame transaction buttons
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAlchemixClient } from '@/lib/contracts/alchemix';
import { formatError } from '@/lib/utils/errors';
import type { VaultType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vaultType = searchParams.get('vault') as VaultType;
    const amountStr = searchParams.get('amount') || '0';

    if (!vaultType || !['alUSD', 'alETH'].includes(vaultType)) {
      return NextResponse.json(
        { error: 'Invalid vault type' },
        { status: 400 },
      );
    }

    const amount = BigInt(amountStr);
    if (amount <= 0n) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 },
      );
    }

    // TODO: Get user address from Farcaster frame context
    const userAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`;

    const client = getAlchemixClient(vaultType);
    const tx = await client.prepareDeposit(vaultType, amount, userAddress);

    return NextResponse.json({
      chainId: `eip155:${client.chain.id}`,
      method: 'eth_sendTransaction',
      params: {
        abi: [],
        to: tx.to,
        data: tx.data,
        value: tx.value.toString(),
      },
    });
  } catch (error) {
    console.error('Error preparing deposit transaction:', error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 500 },
    );
  }
}


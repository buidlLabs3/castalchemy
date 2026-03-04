/**
 * V3 transaction endpoint for deposits.
 * Non-frame callers can request the same prepared transaction shape
 * used by the frame and mini app flows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildV3DepositTransactionResponse } from '@/lib/v3';
import { formatError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await buildV3DepositTransactionResponse(request.nextUrl.searchParams));
  } catch (error) {
    console.error('Error preparing V3 deposit transaction:', error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 400 },
    );
  }
}

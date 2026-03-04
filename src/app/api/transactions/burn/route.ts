/**
 * V3 transaction endpoint for burns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildV3BurnTransactionResponse } from '@/lib/v3';
import { formatError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await buildV3BurnTransactionResponse(request.nextUrl.searchParams));
  } catch (error) {
    console.error('Error preparing V3 burn transaction:', error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 400 },
    );
  }
}

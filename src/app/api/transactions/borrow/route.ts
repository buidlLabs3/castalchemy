/**
 * V3 transaction endpoint for borrows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildV3BorrowTransactionResponse } from '@/lib/v3';
import { formatError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await buildV3BorrowTransactionResponse(request.nextUrl.searchParams));
  } catch (error) {
    console.error('Error preparing V3 borrow transaction:', error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 400 },
    );
  }
}

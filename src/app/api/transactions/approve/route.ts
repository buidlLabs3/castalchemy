/**
 * V3 transaction endpoint for ERC-20 token approval.
 * Must be called before depositing collateral when the user's
 * allowance for the Alchemist contract is insufficient.
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildV3ApproveTransactionResponse } from '@/lib/v3';
import { formatError } from '@/lib/utils/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(buildV3ApproveTransactionResponse(request.nextUrl.searchParams));
  } catch (error) {
    console.error('Error preparing V3 approval transaction:', error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 400 },
    );
  }
}

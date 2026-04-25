/**
 * Farcaster Cast Action handler — "⚗️ Alchemix This"
 *
 * GET  → returns Cast Action metadata (name, icon, description, action type)
 * POST → receives cast context and returns a message + link to the miniapp
 *
 * Spec: https://docs.farcaster.xyz/reference/actions/spec
 */

import { NextResponse } from 'next/server';
import { getMarketSnapshots, formatMarketPercent } from '@/lib/market/snapshots';

const APP_URL =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://castalchemy.vercel.app';

/**
 * GET /api/cast-action
 * Returns the Cast Action metadata so Farcaster clients can register it.
 */
export async function GET() {
  return NextResponse.json(
    {
      name: '⚗️ Alchemix This',
      icon: 'beaker',
      description:
        'View Alchemix yield context for this cast. See current vault APYs, self-repaying loan info, and open a position in one tap.',
      aboutUrl: `${APP_URL}/miniapp`,
      action: {
        type: 'post',
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    },
  );
}

interface CastActionBody {
  untrustedData?: {
    fid?: number;
    url?: string;
    messageHash?: string;
    timestamp?: number;
    network?: number;
    buttonIndex?: number;
    castId?: {
      fid?: number;
      hash?: string;
    };
  };
  trustedData?: {
    messageBytes?: string;
  };
}

/**
 * POST /api/cast-action
 * Receives the cast context and returns a contextual Alchemix message + link.
 */
export async function POST(request: Request) {
  let body: CastActionBody = {};

  try {
    body = (await request.json()) as CastActionBody;
  } catch {
    // If body parsing fails, respond with a generic context.
  }

  const castHash = body.untrustedData?.castId?.hash ?? null;
  const castFid = body.untrustedData?.castId?.fid ?? null;

  // Build a contextual yield summary from current market data
  const snapshots = getMarketSnapshots();
  const topVault = [...snapshots].sort((a, b) => b.currentApy - a.currentApy)[0];

  const yieldLine = `${topVault.label} is yielding ${formatMarketPercent(topVault.currentApy)} APY`;

  // Compose the miniapp link with optional cast context
  const miniappUrl = new URL(`${APP_URL}/miniapp`);

  if (castHash) {
    miniappUrl.searchParams.set('cast', castHash);
  }

  if (castFid) {
    miniappUrl.searchParams.set('fid', castFid.toString());
  }

  return NextResponse.json({
    message: `⚗️ ${yieldLine}. Deposit and let yield repay your loan. Tap below to explore.`,
    link: miniappUrl.toString(),
  });
}

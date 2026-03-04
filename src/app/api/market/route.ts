import { NextResponse } from 'next/server';
import { getMarketSnapshot, getMarketSnapshots } from '@/lib/market/snapshots';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol');

  if (symbol) {
    return NextResponse.json({
      snapshot: getMarketSnapshot(symbol),
      timestamp: Date.now(),
      source: 'provisional-preview',
    });
  }

  return NextResponse.json({
    snapshots: getMarketSnapshots(),
    timestamp: Date.now(),
    source: 'provisional-preview',
  });
}

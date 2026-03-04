import { NextResponse } from 'next/server';
import { getTipConversionPreview, getTipAssetOptions } from '@/lib/social/tips';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const asset = url.searchParams.get('asset');
  const amount = url.searchParams.get('amount');

  return NextResponse.json({
    preview: getTipConversionPreview({
      asset,
      amount,
    }),
    assets: getTipAssetOptions(),
    timestamp: Date.now(),
    source: 'provisional-preview',
  });
}

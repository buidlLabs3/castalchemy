import { NextResponse } from 'next/server';
import { getSocialPreview } from '@/lib/social/preview';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = url.searchParams.get('window');
  const privacyMode = url.searchParams.get('privacy');
  const compare = url.searchParams.get('compare');

  return NextResponse.json({
    social: getSocialPreview({
      window,
      privacyMode,
      socialComparisonEnabled: compare === 'off' ? false : true,
    }),
    timestamp: Date.now(),
    source: 'provisional-preview',
  });
}

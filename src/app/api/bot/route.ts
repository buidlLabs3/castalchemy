import { NextResponse } from 'next/server';
import { getBotBriefing } from '@/lib/automation/briefings';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind');
  const healthStateParam = url.searchParams.get('health');
  const progressParam = Number(url.searchParams.get('progress') ?? '50');
  const healthState =
    healthStateParam === 'watch' || healthStateParam === 'danger' ? healthStateParam : 'safe';

  return NextResponse.json({
    briefing: getBotBriefing(kind, {
      healthState,
      progress: Number.isFinite(progressParam) ? progressParam : 50,
    }),
    timestamp: Date.now(),
    source: 'provisional-preview',
  });
}

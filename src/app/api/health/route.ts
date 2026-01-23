/**
 * Health check endpoint for monitoring
 */

import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/lib/utils/monitoring';

export async function GET() {
  const health = getHealthStatus();

  return NextResponse.json(
    {
      status: health.healthy ? 'healthy' : 'degraded',
      ...health,
      timestamp: Date.now(),
    },
    {
      status: health.healthy ? 200 : 503,
    },
  );
}


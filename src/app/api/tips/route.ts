import { NextResponse } from 'next/server';
import { getTipConversionPreview, getTipAssetOptions } from '@/lib/social/tips';
import {
  getDefaultReferralCode,
  getReferralMetrics,
  getTipTrackingSummary,
  recordReferralConversion,
  recordTipIntent,
} from '@/lib/social/tracking';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const asset = url.searchParams.get('asset');
  const amount = url.searchParams.get('amount');
  const referralCode = url.searchParams.get('code') ?? getDefaultReferralCode();
  const summary = getTipTrackingSummary(8);

  return NextResponse.json({
    preview: getTipConversionPreview({
      asset,
      amount,
    }),
    assets: getTipAssetOptions(),
    summary,
    referral: getReferralMetrics(referralCode),
    timestamp: Date.now(),
    source: 'provisional-preview+tracking',
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    asset?: string | null;
    amount?: string | null;
    wallet?: string | null;
    referralCode?: string | null;
  };
  const preview = getTipConversionPreview({
    asset: body.asset,
    amount: body.amount,
  });
  const referralCode = body.referralCode ?? getDefaultReferralCode();

  const event = recordTipIntent({
    asset: preview.asset,
    normalizedAmount: preview.normalizedAmount,
    usdValue: preview.usdValue,
    estimatedDepositUsd: preview.estimatedDepositUsd,
    projectedMonthlyYieldUsd: preview.projectedMonthlyYieldUsd,
    referralCode,
    wallet: body.wallet,
  });

  const referral = recordReferralConversion({
    code: referralCode,
    projectedRewardUsdDelta: Math.max(preview.estimatedDepositUsd * 0.003, 0.5),
  });

  return NextResponse.json({
    event,
    preview,
    summary: getTipTrackingSummary(8),
    referral,
    timestamp: Date.now(),
    source: 'provisional-preview+tracking',
  });
}

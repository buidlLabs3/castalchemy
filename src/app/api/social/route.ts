import { NextResponse } from 'next/server';
import { getSocialPreview } from '@/lib/social/preview';
import {
  getDefaultReferralCode,
  getReferralMetrics,
  getTipTrackingSummary,
  recordReferralClick,
  recordReferralConversion,
} from '@/lib/social/tracking';

function withTrackedReferral(input: {
  window?: string | null;
  privacyMode?: string | null;
  socialComparisonEnabled?: boolean;
  referralCode?: string | null;
}) {
  const social = getSocialPreview({
    window: input.window,
    privacyMode: input.privacyMode,
    socialComparisonEnabled: input.socialComparisonEnabled,
  });
  const referral = getReferralMetrics(input.referralCode);

  return {
    ...social,
    referral: {
      ...social.referral,
      code: referral.code,
      clicks: referral.clicks,
      conversions: referral.conversions,
      conversionRate: referral.conversionRate,
      projectedRewardUsd: referral.projectedRewardUsd,
      tipReadyAssets: referral.tipReadyAssets,
    },
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const window = url.searchParams.get('window');
  const privacyMode = url.searchParams.get('privacy');
  const compare = url.searchParams.get('compare');
  const code = url.searchParams.get('code');
  const tipSummary = getTipTrackingSummary(3);

  return NextResponse.json({
    social: withTrackedReferral({
      window,
      privacyMode,
      socialComparisonEnabled: compare === 'off' ? false : true,
      referralCode: code,
    }),
    tracking: {
      tipIntents: tipSummary.totalIntents,
    },
    timestamp: Date.now(),
    source: 'provisional-preview+tracking',
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    code?: string | null;
    rewardUsdDelta?: number;
  };

  const action = body.action === 'conversion' ? 'conversion' : 'click';
  const code = body.code ?? getDefaultReferralCode();

  const referral =
    action === 'conversion'
      ? recordReferralConversion({
          code,
          projectedRewardUsdDelta: body.rewardUsdDelta,
        })
      : recordReferralClick(code);
  const tipSummary = getTipTrackingSummary(3);

  return NextResponse.json({
    action,
    referral,
    social: withTrackedReferral({
      referralCode: code,
      socialComparisonEnabled: true,
    }),
    tracking: {
      tipIntents: tipSummary.totalIntents,
    },
    timestamp: Date.now(),
    source: 'provisional-preview+tracking',
  });
}

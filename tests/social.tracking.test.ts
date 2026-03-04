import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDefaultReferralCode,
  getReferralMetrics,
  getTipTrackingSummary,
  recordReferralClick,
  recordReferralConversion,
  recordTipIntent,
} from '../src/lib/social/tracking';

test('default referral metrics are available', () => {
  const metrics = getReferralMetrics();

  assert.equal(metrics.code, getDefaultReferralCode());
  assert.ok(metrics.clicks >= metrics.conversions);
  assert.equal(metrics.tipReadyAssets.length, 3);
});

test('referral click and conversion tracking updates metrics', () => {
  const code = `TEST-${Date.now().toString(36)}`;
  const before = getReferralMetrics(code);
  const clicked = recordReferralClick(code);
  const converted = recordReferralConversion({
    code,
    projectedRewardUsdDelta: 2.5,
  });

  assert.equal(clicked.clicks, before.clicks + 1);
  assert.equal(converted.conversions, clicked.conversions + 1);
  assert.ok(converted.projectedRewardUsd >= clicked.projectedRewardUsd + 2.5);
});

test('tip intent tracking stores events and summary totals', () => {
  const code = `TIP-${Date.now().toString(36)}`;
  const before = getTipTrackingSummary(1);

  const event = recordTipIntent({
    asset: 'USDC',
    normalizedAmount: 20,
    usdValue: 20,
    estimatedDepositUsd: 19.5,
    projectedMonthlyYieldUsd: 0.2,
    referralCode: code,
    wallet: '0x1234',
  });

  const after = getTipTrackingSummary(1);

  assert.match(event.id, /^tip-/);
  assert.equal(event.asset, 'USDC');
  assert.equal(after.totalIntents, before.totalIntents + 1);
  assert.ok(after.totalProjectedDepositUsd >= before.totalProjectedDepositUsd + 19.5);
  assert.equal(after.recentIntents[0]?.id, event.id);
});

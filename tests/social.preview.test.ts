import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatSocialPercent,
  formatSocialUsd,
  getSocialPreview,
} from '../src/lib/social/preview';

test('getSocialPreview defaults to a public weekly leaderboard', () => {
  const social = getSocialPreview();

  assert.equal(social.window, 'weekly');
  assert.equal(social.privacyMode, 'public');
  assert.equal(social.socialComparisonEnabled, true);
  assert.equal(social.leaderboard[0]?.displayName, 'YieldFarmer Nova');
});

test('anonymous mode masks public labels while keeping order intact', () => {
  const social = getSocialPreview({
    privacyMode: 'anonymous',
  });

  assert.equal(social.privacyMode, 'anonymous');
  assert.equal(social.leaderboard[0]?.displayName, 'Wallet A');
  assert.equal(social.leaderboard[1]?.displayName, 'Wallet B');
  assert.match(social.note, /Anonymous mode/);
});

test('social comparison can be disabled without removing referral data', () => {
  const social = getSocialPreview({
    socialComparisonEnabled: false,
  });

  assert.equal(social.socialComparisonEnabled, false);
  assert.equal(social.referral.code, 'CAST-ALCH');
  assert.match(social.note, /Social comparison is hidden/);
});

test('social formatters normalize USD and percentage values', () => {
  assert.equal(formatSocialUsd(18_400), '$18.4K');
  assert.equal(formatSocialUsd(1_250_000), '$1.25M');
  assert.equal(formatSocialPercent(18.4), '18.4%');
});

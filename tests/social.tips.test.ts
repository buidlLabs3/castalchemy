import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatTipAssetAmount,
  formatTipUsd,
  getTipAssetOptions,
  getTipConversionPreview,
} from '../src/lib/social/tips';

test('getTipAssetOptions exposes the supported tip routes', () => {
  const options = getTipAssetOptions();

  assert.deepEqual(
    options.map((option) => option.asset),
    ['USDC', 'ETH', 'DEGEN'],
  );
});

test('getTipConversionPreview defaults to the stable tip route', () => {
  const preview = getTipConversionPreview({
    amount: '25',
  });

  assert.equal(preview.asset, 'USDC');
  assert.equal(preview.normalizedAmount, 25);
  assert.equal(preview.estimatedDepositUsd, 24.5);
});

test('getTipConversionPreview uses the requested asset profile', () => {
  const preview = getTipConversionPreview({
    asset: 'DEGEN',
    amount: '1200',
  });

  assert.equal(preview.asset, 'DEGEN');
  assert.ok(preview.routingFeeUsd > 0);
  assert.match(preview.note, /High-volatility tips/);
});

test('tip formatters normalize display values', () => {
  assert.equal(formatTipUsd(24.5), '$24.50');
  assert.equal(formatTipUsd(2_450), '$2.5K');
  assert.equal(formatTipAssetAmount('ETH', 0.34567), '0.346 ETH');
});

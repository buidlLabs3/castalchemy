import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatMarketDelta,
  formatMarketPercent,
  formatMarketUsd,
  getMarketSnapshot,
  getMarketSnapshots,
} from '../src/lib/market/snapshots';

test('getMarketSnapshots returns both provisional market entries', () => {
  const snapshots = getMarketSnapshots();

  assert.equal(snapshots.length, 2);
  assert.deepEqual(
    snapshots.map((snapshot) => snapshot.symbol),
    ['alUSD', 'alETH'],
  );
});

test('getMarketSnapshot falls back safely and resolves requested market', () => {
  assert.equal(getMarketSnapshot('alETH').symbol, 'alETH');
  assert.equal(getMarketSnapshot('unsupported').symbol, 'alUSD');
});

test('market formatters return stable display strings', () => {
  assert.equal(formatMarketPercent(7.18), '7.18%');
  assert.equal(formatMarketDelta(0.36), '+0.36%');
  assert.equal(formatMarketDelta(-0.11), '-0.11%');
  assert.equal(formatMarketUsd(2_480_000), '$2.48M');
  assert.equal(formatMarketUsd(980), '$980');
});

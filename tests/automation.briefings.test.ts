import assert from 'node:assert/strict';
import test from 'node:test';

import { getBotBriefing, getBotBriefingKinds } from '../src/lib/automation/briefings';

test('getBotBriefingKinds exposes the supported bot scenarios', () => {
  assert.deepEqual(getBotBriefingKinds(), ['daily', 'health', 'milestone']);
});

test('daily bot briefing produces an analytics-oriented summary', () => {
  const briefing = getBotBriefing('daily');

  assert.equal(briefing.kind, 'daily');
  assert.equal(briefing.cta, 'Open Analytics');
  assert.equal(briefing.severity, 'info');
});

test('health bot briefing reflects the supplied risk state', () => {
  const watchBriefing = getBotBriefing('health', { healthState: 'watch' });
  const dangerBriefing = getBotBriefing('health', { healthState: 'danger' });

  assert.equal(watchBriefing.severity, 'watch');
  assert.equal(dangerBriefing.severity, 'critical');
  assert.match(dangerBriefing.headline, /Health Alert/);
});

test('milestone bot briefing normalizes progress checkpoints', () => {
  const briefing = getBotBriefing('milestone', { progress: 88 });

  assert.equal(briefing.kind, 'milestone');
  assert.match(briefing.headline, /75% Repayment Milestone/);
});

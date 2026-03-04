import type { V3HealthState } from '../v3';
import { formatMarketDelta, formatMarketPercent, getMarketSnapshots } from '../market/snapshots';

export type BotBriefingKind = 'daily' | 'health' | 'milestone';
export type BotBriefingSeverity = 'info' | 'watch' | 'critical' | 'success';

export interface BotBriefing {
  kind: BotBriefingKind;
  headline: string;
  summary: string;
  lines: [string, string, string];
  cta: string;
  severity: BotBriefingSeverity;
}

function buildDailyBriefing(): BotBriefing {
  const snapshots = getMarketSnapshots();
  const strongest = [...snapshots].sort((left, right) => right.currentApy - left.currentApy)[0];
  const fastestMover = [...snapshots].sort(
    (left, right) => Math.abs(right.apyDelta7d) - Math.abs(left.apyDelta7d),
  )[0];

  return {
    kind: 'daily',
    headline: 'Daily Yield Briefing',
    summary: `${strongest.label} currently leads the preview set on APY.`,
    lines: [
      `${strongest.label}: ${formatMarketPercent(strongest.currentApy)} current APY`,
      `Largest 7d move: ${fastestMover.label} ${formatMarketDelta(fastestMover.apyDelta7d)}`,
      'Use analytics plus position health together before increasing borrow size.',
    ],
    cta: 'Open Analytics',
    severity: 'info',
  };
}

function buildHealthBriefing(healthState: V3HealthState): BotBriefing {
  if (healthState === 'danger') {
    return {
      kind: 'health',
      headline: 'Health Alert',
      summary: 'A monitored position is trending into unsafe territory.',
      lines: [
        'Debt is crowding out available safety margin.',
        'Repay or reduce borrow exposure before taking new risk.',
        'Avoid additional withdraws until the position returns to watch or safe.',
      ],
      cta: 'Open Positions',
      severity: 'critical',
    };
  }

  if (healthState === 'watch') {
    return {
      kind: 'health',
      headline: 'Watchlist Update',
      summary: 'A position is still healthy, but the buffer is tightening.',
      lines: [
        'Borrow room is narrowing as utilization rises.',
        'Monitor credit headroom before taking the next action.',
        'A partial repay can improve flexibility without closing the position.',
      ],
      cta: 'Review Borrow',
      severity: 'watch',
    };
  }

  return {
    kind: 'health',
    headline: 'Healthy Position Check',
    summary: 'Current monitored positions remain in a safe operating range.',
    lines: [
      'Collateral is comfortably covering debt.',
      'There is still room for cautious borrowing or withdrawals.',
      'Keep watching available credit before changing strategy.',
    ],
    cta: 'Open Positions',
    severity: 'success',
  };
}

function normalizeMilestoneProgress(progress: number): number {
  if (progress >= 100) {
    return 100;
  }

  if (progress >= 75) {
    return 75;
  }

  if (progress >= 50) {
    return 50;
  }

  return 25;
}

function buildMilestoneBriefing(progress: number): BotBriefing {
  const normalized = normalizeMilestoneProgress(progress);

  return {
    kind: 'milestone',
    headline: `${normalized}% Repayment Milestone`,
    summary: 'This is the style of shareable progress post the bot can emit.',
    lines: [
      `Position debt repayment has crossed the ${normalized}% checkpoint.`,
      'Milestone posts can convert passive progress into social proof.',
      'Use them sparingly so the bot stays signal-heavy instead of noisy.',
    ],
    cta: 'Open Learning Path',
    severity: normalized === 100 ? 'success' : 'info',
  };
}

export function getBotBriefing(
  kindValue: string | null | undefined,
  options: {
    healthState?: V3HealthState;
    progress?: number;
  } = {},
): BotBriefing {
  const kind: BotBriefingKind =
    kindValue === 'health' || kindValue === 'milestone' ? kindValue : 'daily';

  switch (kind) {
    case 'health':
      return buildHealthBriefing(options.healthState ?? 'safe');
    case 'milestone':
      return buildMilestoneBriefing(options.progress ?? 50);
    case 'daily':
    default:
      return buildDailyBriefing();
  }
}

export function getBotBriefingKinds(): BotBriefingKind[] {
  return ['daily', 'health', 'milestone'];
}

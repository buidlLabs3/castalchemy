export interface EducationLesson {
  step: number;
  totalSteps: number;
  title: string;
  summary: string;
  bullets: [string, string, string];
  actionLabel: string;
}

const LESSONS: Omit<EducationLesson, 'totalSteps'>[] = [
  {
    step: 1,
    title: 'MYT and Yield',
    summary: 'Deposit ETH or USDC into Mix-Yield Tokens so your collateral keeps earning across DAO-managed strategies.',
    bullets: [
      'MYT represents a growing claim on the underlying assets.',
      'Strategies are curated and rebalanced by the Alchemix system.',
      'There are no app-level lockups in the basic vault path.',
    ],
    actionLabel: 'Open Vaults',
  },
  {
    step: 2,
    title: 'Borrowing with Positions',
    summary: 'Alchemix V3 positions are tokenId-backed units that track collateral, debt, available credit, and health.',
    bullets: [
      'Borrowing mints alETH or alUSD against the selected position.',
      'Docs describe borrowing up to 90%, but conservative buffers are still the user-facing default.',
      'Repay, burn, and self-liquidate actions reduce or close debt exposure.',
    ],
    actionLabel: 'Open Positions',
  },
  {
    step: 3,
    title: 'Redemptions and Risk',
    summary: 'Scheduled redemptions reduce debt over time, while liquidation risk comes from strategy loss rather than spot price swings.',
    bullets: [
      'Transmuter redemptions convert alAssets back to the underlying asset over a fixed term.',
      'The health bar matters before borrowing, withdrawing, or routing social funds.',
      'Use Sepolia for testing and mainnet only after contract addresses are verified.',
    ],
    actionLabel: 'Review Borrow',
  },
] as const;

function withTotals(lesson: Omit<EducationLesson, 'totalSteps'>): EducationLesson {
  return {
    ...lesson,
    totalSteps: LESSONS.length,
  };
}

export function getEducationLessons(): EducationLesson[] {
  return LESSONS.map(withTotals);
}

export function getEducationLesson(stepValue: string | number | null | undefined): EducationLesson {
  const parsed = Number(stepValue);

  if (!Number.isFinite(parsed)) {
    return withTotals(LESSONS[0]);
  }

  const clamped = Math.min(Math.max(Math.trunc(parsed), 1), LESSONS.length);
  return withTotals(LESSONS[clamped - 1]);
}

export function getPreviousEducationStep(step: number): number {
  return step <= 1 ? 1 : step - 1;
}

export function getNextEducationStep(step: number): number {
  return step >= LESSONS.length ? LESSONS.length : step + 1;
}

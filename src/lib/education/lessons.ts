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
    title: 'Self-Repaying Basics',
    summary: 'Deposit collateral, mint against it, and let yield do the repayment work over time.',
    bullets: [
      'Collateral keeps earning instead of sitting idle.',
      'Borrowing is capped by position health and available credit.',
      'The core mental model is yield offsets debt, not instant payoff.',
    ],
    actionLabel: 'Review Deposit',
  },
  {
    step: 2,
    title: 'TokenId Positions',
    summary: 'V3-style positions are owned as tokenId-backed units, so one wallet can manage several strategies.',
    bullets: [
      'Each position tracks its own collateral, debt, and available credit.',
      'Risk is evaluated per position instead of one shared wallet bucket.',
      'This makes segmented strategies and cleaner monitoring possible.',
    ],
    actionLabel: 'Open Positions',
  },
  {
    step: 3,
    title: 'Risk and Health',
    summary: 'Healthy positions keep enough collateral relative to debt to preserve safe borrowing headroom.',
    bullets: [
      'Borrow and withdraw reduce available safety margin.',
      'Repay and burn reduce debt and improve health.',
      'Watch positions need attention before they drift into danger.',
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

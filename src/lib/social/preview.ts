export type LeaderboardWindow = 'weekly' | 'monthly';
export type SocialPrivacyMode = 'public' | 'anonymous';

export interface SocialLeaderboardEntry {
  rank: number;
  displayName: string;
  handle: string;
  score: number;
  capitalUsd: number;
  repaymentProgress: number;
}

export interface ReferralPreview {
  code: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  projectedRewardUsd: number;
  tipReadyAssets: [string, string, string];
}

export interface SocialPreview {
  window: LeaderboardWindow;
  privacyMode: SocialPrivacyMode;
  socialComparisonEnabled: boolean;
  leaderboard: SocialLeaderboardEntry[];
  referral: ReferralPreview;
  note: string;
}

interface BaseLeaderboardEntry {
  rank: number;
  displayName: string;
  handle: string;
  score: number;
  capitalUsd: number;
  repaymentProgress: number;
}

const WEEKLY_LEADERBOARD: BaseLeaderboardEntry[] = [
  {
    rank: 1,
    displayName: 'YieldFarmer Nova',
    handle: '@nova',
    score: 96,
    capitalUsd: 18_400,
    repaymentProgress: 76,
  },
  {
    rank: 2,
    displayName: 'Debt Alchemist',
    handle: '@alchemist',
    score: 91,
    capitalUsd: 15_900,
    repaymentProgress: 68,
  },
  {
    rank: 3,
    displayName: 'Stable Loop',
    handle: '@stableloop',
    score: 84,
    capitalUsd: 12_250,
    repaymentProgress: 57,
  },
] as const;

const MONTHLY_LEADERBOARD: BaseLeaderboardEntry[] = [
  {
    rank: 1,
    displayName: 'YieldFarmer Nova',
    handle: '@nova',
    score: 98,
    capitalUsd: 24_600,
    repaymentProgress: 82,
  },
  {
    rank: 2,
    displayName: 'Stable Loop',
    handle: '@stableloop',
    score: 89,
    capitalUsd: 19_300,
    repaymentProgress: 71,
  },
  {
    rank: 3,
    displayName: 'Debt Alchemist',
    handle: '@alchemist',
    score: 85,
    capitalUsd: 17_150,
    repaymentProgress: 63,
  },
] as const;

const REFERRAL_PREVIEW: ReferralPreview = {
  code: 'CAST-ALCH',
  clicks: 38,
  conversions: 7,
  conversionRate: 18.4,
  projectedRewardUsd: 74,
  tipReadyAssets: ['USDC', 'ETH', 'DEGEN'],
};

function getBaseEntries(window: LeaderboardWindow): BaseLeaderboardEntry[] {
  return window === 'monthly' ? MONTHLY_LEADERBOARD : WEEKLY_LEADERBOARD;
}

function anonymizeEntry(entry: BaseLeaderboardEntry): SocialLeaderboardEntry {
  const letter = String.fromCharCode(64 + entry.rank);

  return {
    ...entry,
    displayName: `Wallet ${letter}`,
    handle: 'anonymous',
  };
}

function toLeaderboardEntries(
  window: LeaderboardWindow,
  privacyMode: SocialPrivacyMode,
): SocialLeaderboardEntry[] {
  const entries = getBaseEntries(window);

  return entries.map((entry) =>
    privacyMode === 'anonymous' ? anonymizeEntry(entry) : { ...entry },
  );
}

export function getSocialPreview(options: {
  window?: string | null;
  privacyMode?: string | null;
  socialComparisonEnabled?: boolean;
} = {}): SocialPreview {
  const window: LeaderboardWindow = options.window === 'monthly' ? 'monthly' : 'weekly';
  const privacyMode: SocialPrivacyMode =
    options.privacyMode === 'anonymous' ? 'anonymous' : 'public';
  const socialComparisonEnabled =
    options.socialComparisonEnabled === undefined ? true : options.socialComparisonEnabled;

  let note = 'Public mode shows sample labels to preview social ranking behavior.';

  if (!socialComparisonEnabled) {
    note = 'Social comparison is hidden while referral tracking stays enabled.';
  } else if (privacyMode === 'anonymous') {
    note = 'Anonymous mode hides public labels while preserving leaderboard order.';
  }

  return {
    window,
    privacyMode,
    socialComparisonEnabled,
    leaderboard: toLeaderboardEntries(window, privacyMode),
    referral: { ...REFERRAL_PREVIEW },
    note,
  };
}

export function formatSocialUsd(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

export function formatSocialPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

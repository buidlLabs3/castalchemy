import type { TipAsset } from '@/lib/social/tips';

const DEFAULT_REFERRAL_CODE = 'CAST-ALCH';
const DEFAULT_REFERRAL_CLICKS = 38;
const DEFAULT_REFERRAL_CONVERSIONS = 7;
const DEFAULT_REFERRAL_REWARD_USD = 74;
const TIP_READY_ASSETS: [string, string, string] = ['USDC', 'ETH', 'DEGEN'];
const MAX_STORED_TIP_INTENTS = 120;

interface ReferralState {
  code: string;
  clicks: number;
  conversions: number;
  projectedRewardUsd: number;
}

export interface ReferralMetrics {
  code: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  projectedRewardUsd: number;
  tipReadyAssets: [string, string, string];
}

export interface TipIntentEvent {
  id: string;
  asset: TipAsset;
  normalizedAmount: number;
  usdValue: number;
  estimatedDepositUsd: number;
  projectedMonthlyYieldUsd: number;
  referralCode: string | null;
  wallet: string | null;
  createdAt: string;
}

export interface TipTrackingSummary {
  totalIntents: number;
  totalIntendedUsd: number;
  totalProjectedDepositUsd: number;
  recentIntents: TipIntentEvent[];
}

interface SocialTrackingStore {
  referrals: Map<string, ReferralState>;
  tipIntents: TipIntentEvent[];
}

declare global {
  // eslint-disable-next-line no-var
  var __castalchemyTrackingStore: SocialTrackingStore | undefined;
}

function normalizeReferralCode(code?: string | null): string {
  const normalized = (code ?? '').trim().toUpperCase();
  return normalized || DEFAULT_REFERRAL_CODE;
}

function sanitizePositiveNumber(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function createInitialStore(): SocialTrackingStore {
  const referrals = new Map<string, ReferralState>();
  referrals.set(DEFAULT_REFERRAL_CODE, {
    code: DEFAULT_REFERRAL_CODE,
    clicks: DEFAULT_REFERRAL_CLICKS,
    conversions: DEFAULT_REFERRAL_CONVERSIONS,
    projectedRewardUsd: DEFAULT_REFERRAL_REWARD_USD,
  });

  return {
    referrals,
    tipIntents: [],
  };
}

function getStore(): SocialTrackingStore {
  if (!globalThis.__castalchemyTrackingStore) {
    globalThis.__castalchemyTrackingStore = createInitialStore();
  }

  return globalThis.__castalchemyTrackingStore;
}

function getOrCreateReferralState(code?: string | null): ReferralState {
  const store = getStore();
  const normalizedCode = normalizeReferralCode(code);
  const existing = store.referrals.get(normalizedCode);

  if (existing) {
    return existing;
  }

  const nextState: ReferralState = {
    code: normalizedCode,
    clicks: 0,
    conversions: 0,
    projectedRewardUsd: 0,
  };
  store.referrals.set(normalizedCode, nextState);
  return nextState;
}

function toReferralMetrics(state: ReferralState): ReferralMetrics {
  const conversionRate = state.clicks > 0 ? (state.conversions / state.clicks) * 100 : 0;

  return {
    code: state.code,
    clicks: state.clicks,
    conversions: state.conversions,
    conversionRate,
    projectedRewardUsd: state.projectedRewardUsd,
    tipReadyAssets: [...TIP_READY_ASSETS],
  };
}

export function getReferralMetrics(code?: string | null): ReferralMetrics {
  return toReferralMetrics(getOrCreateReferralState(code));
}

export function recordReferralClick(code?: string | null): ReferralMetrics {
  const state = getOrCreateReferralState(code);
  state.clicks += 1;
  return toReferralMetrics(state);
}

export function recordReferralConversion(options: {
  code?: string | null;
  projectedRewardUsdDelta?: number;
} = {}): ReferralMetrics {
  const state = getOrCreateReferralState(options.code);
  state.conversions += 1;
  state.projectedRewardUsd += sanitizePositiveNumber(options.projectedRewardUsdDelta ?? 0);
  return toReferralMetrics(state);
}

export function recordTipIntent(input: {
  asset: TipAsset;
  normalizedAmount: number;
  usdValue: number;
  estimatedDepositUsd: number;
  projectedMonthlyYieldUsd: number;
  referralCode?: string | null;
  wallet?: string | null;
}): TipIntentEvent {
  const store = getStore();

  const event: TipIntentEvent = {
    id: `tip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    asset: input.asset,
    normalizedAmount: input.normalizedAmount,
    usdValue: sanitizePositiveNumber(input.usdValue),
    estimatedDepositUsd: sanitizePositiveNumber(input.estimatedDepositUsd),
    projectedMonthlyYieldUsd: sanitizePositiveNumber(input.projectedMonthlyYieldUsd),
    referralCode: input.referralCode ? normalizeReferralCode(input.referralCode) : null,
    wallet: input.wallet?.trim() || null,
    createdAt: new Date().toISOString(),
  };

  store.tipIntents.unshift(event);
  store.tipIntents = store.tipIntents.slice(0, MAX_STORED_TIP_INTENTS);

  return event;
}

export function getTipTrackingSummary(limit = 6): TipTrackingSummary {
  const store = getStore();
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 6;
  const recentIntents = store.tipIntents.slice(0, safeLimit).map((intent) => ({ ...intent }));

  let totalIntendedUsd = 0;
  let totalProjectedDepositUsd = 0;

  for (const intent of store.tipIntents) {
    totalIntendedUsd += intent.usdValue;
    totalProjectedDepositUsd += intent.estimatedDepositUsd;
  }

  return {
    totalIntents: store.tipIntents.length,
    totalIntendedUsd,
    totalProjectedDepositUsd,
    recentIntents,
  };
}

export function getDefaultReferralCode(): string {
  return DEFAULT_REFERRAL_CODE;
}

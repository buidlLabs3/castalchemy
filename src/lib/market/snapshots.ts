export type MarketSymbol = 'alUSD' | 'alETH';
export type MarketTrend = 'up' | 'flat' | 'down';

export interface MarketSnapshot {
  symbol: MarketSymbol;
  label: string;
  currentApy: number;
  apyDelta7d: number;
  apyDelta30d: number;
  utilization: number;
  tvlUsd: number;
  projectedAnnualYieldOnOneUnit: number;
  trend: MarketTrend;
  note: string;
}

const MARKET_SNAPSHOTS: MarketSnapshot[] = [
  {
    symbol: 'alUSD',
    label: 'alUSD Vault',
    currentApy: 7.18,
    apyDelta7d: 0.36,
    apyDelta30d: 0.91,
    utilization: 68.4,
    tvlUsd: 2_480_000,
    projectedAnnualYieldOnOneUnit: 0.0718,
    trend: 'up',
    note: 'Stablecoin-oriented yield profile with tighter variance.',
  },
  {
    symbol: 'alETH',
    label: 'alETH Vault',
    currentApy: 4.92,
    apyDelta7d: -0.11,
    apyDelta30d: 0.42,
    utilization: 54.7,
    tvlUsd: 1_760_000,
    projectedAnnualYieldOnOneUnit: 0.0492,
    trend: 'flat',
    note: 'Lower base yield, but cleaner headroom for new borrow demand.',
  },
] as const;

export function getMarketSnapshots(): MarketSnapshot[] {
  return MARKET_SNAPSHOTS.map((snapshot) => ({ ...snapshot }));
}

export function getMarketSnapshot(symbol: string | null | undefined): MarketSnapshot {
  const normalized = symbol === 'alETH' ? 'alETH' : 'alUSD';
  return getMarketSnapshots().find((snapshot) => snapshot.symbol === normalized)!;
}

export function formatMarketPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function formatMarketUsd(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(0)}`;
}

export function formatMarketDelta(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

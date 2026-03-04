export type TipAsset = 'USDC' | 'ETH' | 'DEGEN';

export interface TipAssetOption {
  asset: TipAsset;
  label: string;
  usdRate: number;
  routeLabel: string;
  destinationVault: string;
  bufferRate: number;
  monthlyYieldRate: number;
  actionLabel: string;
}

export interface TipConversionPreview {
  asset: TipAsset;
  normalizedAmount: number;
  usdValue: number;
  routingFeeUsd: number;
  estimatedDepositUsd: number;
  projectedMonthlyYieldUsd: number;
  routeLabel: string;
  destinationVault: string;
  actionLabel: string;
  note: string;
}

const TIP_ASSET_OPTIONS: TipAssetOption[] = [
  {
    asset: 'USDC',
    label: 'Stable tip',
    usdRate: 1,
    routeLabel: 'Stable tip -> alUSD queue',
    destinationVault: 'alUSD savings path',
    bufferRate: 0.02,
    monthlyYieldRate: 0.009,
    actionLabel: 'Sweep stable tips into the alUSD ladder',
  },
  {
    asset: 'ETH',
    label: 'ETH tip',
    usdRate: 3400,
    routeLabel: 'ETH tip -> wrapped collateral lane',
    destinationVault: 'alETH growth path',
    bufferRate: 0.028,
    monthlyYieldRate: 0.011,
    actionLabel: 'Route ETH tips into the alETH staging vault',
  },
  {
    asset: 'DEGEN',
    label: 'Community tip',
    usdRate: 0.021,
    routeLabel: 'DEGEN tip -> convert and stage',
    destinationVault: 'social tip conversion lane',
    bufferRate: 0.042,
    monthlyYieldRate: 0.013,
    actionLabel: 'Convert DEGEN tips before staging a deposit',
  },
] as const;

function normalizeAmountInput(value?: string | number | null): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  const parsed = Number.parseFloat((value ?? '').toString().trim());

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

function resolveTipAsset(asset?: string | null): TipAssetOption {
  return TIP_ASSET_OPTIONS.find((option) => option.asset === asset) ?? TIP_ASSET_OPTIONS[0];
}

export function getTipAssetOptions(): TipAssetOption[] {
  return TIP_ASSET_OPTIONS.map((option) => ({ ...option }));
}

export function getTipConversionPreview(options: {
  asset?: string | null;
  amount?: string | number | null;
} = {}): TipConversionPreview {
  const asset = resolveTipAsset(options.asset);
  const normalizedAmount = normalizeAmountInput(options.amount);
  const usdValue = normalizedAmount * asset.usdRate;
  const routingFeeUsd = usdValue * asset.bufferRate;
  const estimatedDepositUsd = Math.max(usdValue - routingFeeUsd, 0);
  const projectedMonthlyYieldUsd = estimatedDepositUsd * asset.monthlyYieldRate;

  return {
    asset: asset.asset,
    normalizedAmount,
    usdValue,
    routingFeeUsd,
    estimatedDepositUsd,
    projectedMonthlyYieldUsd,
    routeLabel: asset.routeLabel,
    destinationVault: asset.destinationVault,
    actionLabel: asset.actionLabel,
    note:
      asset.asset === 'DEGEN'
        ? 'High-volatility tips need a larger routing buffer before staging a deposit.'
        : 'This keeps a small routing buffer so the preview stays conservative before live execution.',
  };
}

export function formatTipUsd(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toFixed(2)}`;
}

export function formatTipAssetAmount(asset: TipAsset, value: number): string {
  const decimals = asset === 'ETH' ? 3 : asset === 'DEGEN' ? 0 : 2;
  return `${value.toFixed(decimals)} ${asset}`;
}

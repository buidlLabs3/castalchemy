import type { Address } from 'viem';
import type { V3MarketId, V3ProtocolConfig } from './types';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
export const V3_MAINNET_CHAIN_ID = 1;
export const SUPPORTED_V3_CHAIN_IDS = [V3_MAINNET_CHAIN_ID] as const;
export const SUPPORTED_V3_MARKET_IDS = ['usdc', 'eth'] as const satisfies readonly V3MarketId[];

export type SupportedV3ChainId = (typeof SUPPORTED_V3_CHAIN_IDS)[number];

export const V3_CHAIN_METADATA: Record<SupportedV3ChainId, {
  label: string;
  shortLabel: string;
  explorerUrl: string;
  rpcEnvKey: string;
}> = {
  [V3_MAINNET_CHAIN_ID]: {
    label: 'Ethereum Mainnet',
    shortLabel: 'Mainnet',
    explorerUrl: 'https://etherscan.io',
    rpcEnvKey: 'ETHEREUM_RPC_URL',
  },
};

type KnownV3Market = Omit<V3ProtocolConfig, 'enabled' | 'chainId' | 'rpcUrl' | 'isConfigured'>;

// Official Mainnet V3 deployment addresses.
// Source: alchemix-finance/v3 broadcast/DeployV3ETH.s.sol/1/run-latest.json at
// commit a83b98cd93539e533a3988ec3bb5cd090075ad43.
const MAINNET_V3_MARKETS: Record<V3MarketId, KnownV3Market> = {
  usdc: {
    marketId: 'usdc',
    marketLabel: 'USDC / alUSD',
    baseAssetSymbol: 'USDC',
    debtTokenSymbol: 'alUSD',
    underlyingDecimals: 6,
    debtTokenDecimals: 18,
    mytDecimals: 18,
    usesNativeEth: false,
    underlyingTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address,
    debtTokenAddress: '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9' as Address,
    mytAddress: '0x9b44efca3e2a707b63dc00ce79d646e5e5d24ba5' as Address,
    alchemistAddress: '0xeb83112d925268bede86654c13d423a987587e3e' as Address,
    positionNftAddress: '0x872a03fabc86b59c883cd9c439e969321b719beb' as Address,
    transmuterAddress: '0x2584e8b0616b3e750492c9629a3b27679c410cb9' as Address,
    routerAddress: '0x6733aa6b2a622e43e8ff61945e8fbe5f1b6b00fd' as Address,
  },
  eth: {
    marketId: 'eth',
    marketLabel: 'ETH / alETH',
    baseAssetSymbol: 'ETH',
    debtTokenSymbol: 'alETH',
    underlyingDecimals: 18,
    debtTokenDecimals: 18,
    mytDecimals: 18,
    usesNativeEth: true,
    underlyingTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address,
    debtTokenAddress: '0x0100546F2cD4C9D97f798fFC9755E47865FF7Ee6' as Address,
    mytAddress: '0x29bcfed246ce37319d94eba107db90c453d4c43d' as Address,
    alchemistAddress: '0xfa995b6abc387376c3e7de5f6d394ab5b6bee26b' as Address,
    positionNftAddress: '0x15da4c7db6404b92894d5214fac92057fb8a263d' as Address,
    transmuterAddress: '0x073598132f37756a7e665fb52f1757463120bd3c' as Address,
    routerAddress: '0xdb852896a23c7e2519b75aea692cacf834d086ab' as Address,
  },
};

// ─── Known V3 Deployment Addresses (from alchemix-finance/v3 broadcast) ─────
export const V3_KNOWN_DEPLOYMENTS: Record<number, { label: string; contracts: Partial<Record<string, Address>> }> = {
  [V3_MAINNET_CHAIN_ID]: {
    label: 'Ethereum Mainnet',
    contracts: {
      vault2Factory: '0xdd56b00302e91c4c2b8246156bdeaa1cedc58984' as Address,
      mixUsdcVault2: MAINNET_V3_MARKETS.usdc.mytAddress,
      mixWethVault2: MAINNET_V3_MARKETS.eth.mytAddress,
      usdcAlchemist: MAINNET_V3_MARKETS.usdc.alchemistAddress,
      ethAlchemist: MAINNET_V3_MARKETS.eth.alchemistAddress,
      usdcRouter: MAINNET_V3_MARKETS.usdc.routerAddress,
      ethRouter: MAINNET_V3_MARKETS.eth.routerAddress,
      alchemistCurator: '0x7d61e3cde8b58c4be192a7a35e9d626c419302a4' as Address,
      strategyClassifier: '0xdb7d25b0bfd1585a797f6bf7d7ccba26e77253cc' as Address,
    },
  },
};

function readBoolean(value?: string): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function isSupportedV3ChainId(chainId: number): chainId is SupportedV3ChainId {
  return SUPPORTED_V3_CHAIN_IDS.includes(chainId as SupportedV3ChainId);
}

export function isSupportedV3MarketId(marketId: string | null | undefined): marketId is V3MarketId {
  return SUPPORTED_V3_MARKET_IDS.includes(marketId as V3MarketId);
}

function readSupportedChainId(value: string | undefined): SupportedV3ChainId {
  const parsed = readNumber(value, V3_MAINNET_CHAIN_ID);
  return isSupportedV3ChainId(parsed) ? parsed : V3_MAINNET_CHAIN_ID;
}

function readSupportedMarketId(value: string | undefined): V3MarketId {
  return isSupportedV3MarketId(value) ? value : 'usdc';
}

export function getV3ChainMetadata(chainId: number = v3Config.chainId) {
  const supportedChainId = isSupportedV3ChainId(chainId) ? chainId : V3_MAINNET_CHAIN_ID;
  return V3_CHAIN_METADATA[supportedChainId];
}

export function getSupportedV3Markets(chainId: number = V3_MAINNET_CHAIN_ID): V3ProtocolConfig[] {
  if (!isSupportedV3ChainId(chainId)) {
    return [];
  }

  return SUPPORTED_V3_MARKET_IDS.map((marketId) => getV3Config(chainId, marketId));
}

function isConfiguredAddress(value: Address): boolean {
  return value !== ZERO_ADDRESS;
}

function readRpcUrl(chainId: SupportedV3ChainId): string | null {
  if (chainId !== V3_MAINNET_CHAIN_ID) {
    return null;
  }

  return (
    process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_RPC_URL ||
    process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL ||
    process.env.ETHEREUM_RPC_URL ||
    null
  );
}

function buildV3Config(chainId: SupportedV3ChainId, marketId: V3MarketId): V3ProtocolConfig {
  const market = MAINNET_V3_MARKETS[marketId];
  const rpcUrl = readRpcUrl(chainId);
  const enabled = readBoolean(process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3);
  const isConfigured = [
    market.alchemistAddress,
    market.positionNftAddress,
    market.transmuterAddress,
    market.debtTokenAddress,
    market.underlyingTokenAddress,
    market.mytAddress,
    market.routerAddress,
  ].every(isConfiguredAddress);

  return {
    enabled,
    chainId,
    rpcUrl,
    ...market,
    isConfigured,
  };
}

export const v3Configs: Record<SupportedV3ChainId, Record<V3MarketId, V3ProtocolConfig>> = {
  [V3_MAINNET_CHAIN_ID]: {
    usdc: buildV3Config(V3_MAINNET_CHAIN_ID, 'usdc'),
    eth: buildV3Config(V3_MAINNET_CHAIN_ID, 'eth'),
  },
};

export function getV3Config(
  chainId: number = readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID),
  marketId: string | null | undefined = readSupportedMarketId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MARKET_ID),
): V3ProtocolConfig {
  const supportedChainId = isSupportedV3ChainId(chainId)
    ? chainId
    : readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID);
  const supportedMarketId = isSupportedV3MarketId(marketId)
    ? marketId
    : readSupportedMarketId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MARKET_ID);

  return v3Configs[supportedChainId][supportedMarketId];
}

export const v3Config = getV3Config(
  readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID),
  readSupportedMarketId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MARKET_ID),
);

export function canUseContractV3(chainId: number = v3Config.chainId, marketId: string | null | undefined = v3Config.marketId): boolean {
  const config = getV3Config(chainId, marketId);
  return config.isConfigured && !!config.rpcUrl;
}

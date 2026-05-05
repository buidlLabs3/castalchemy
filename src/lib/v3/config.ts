import type { Address } from 'viem';
import type { V3ProtocolConfig } from './types';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
export const V3_MAINNET_CHAIN_ID = 1;
export const V3_TESTNET_CHAIN_ID = 11155111;
export const SUPPORTED_V3_CHAIN_IDS = [V3_MAINNET_CHAIN_ID, V3_TESTNET_CHAIN_ID] as const;

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
  [V3_TESTNET_CHAIN_ID]: {
    label: 'Sepolia Testnet',
    shortLabel: 'Sepolia',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcEnvKey: 'SEPOLIA_RPC_URL',
  },
};

// ─── Known V3 Deployment Addresses (from alchemix-finance/v3 broadcast) ─────
// NOTE: These may change. Always verify against official Alchemix governance.
export const V3_KNOWN_DEPLOYMENTS: Record<number, { label: string; contracts: Partial<Record<string, Address>> }> = {
  [V3_MAINNET_CHAIN_ID]: {
    label: 'Ethereum Mainnet',
    contracts: {
      vault2Factory: '0xdd56b00302e91c4c2b8246156bdeaa1cedc58984' as Address,
      mixUsdcVault2: '0x9b44efca3e2a707b63dc00ce79d646e5e5d24ba5' as Address,
      mixWethVault2: '0x29bcfed246ce37319d94eba107db90c453d4c43d' as Address,
      alchemistCurator: '0x7d61e3cde8b58c4be192a7a35e9d626c419302a4' as Address,
      strategyClassifier: '0xdb7d25b0bfd1585a797f6bf7d7ccba26e77253cc' as Address,
    },
  },
  [V3_TESTNET_CHAIN_ID]: {
    label: 'Sepolia Testnet',
    contracts: {},
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

function readSupportedChainId(value: string | undefined): SupportedV3ChainId {
  const parsed = readNumber(value, V3_MAINNET_CHAIN_ID);
  return isSupportedV3ChainId(parsed) ? parsed : V3_MAINNET_CHAIN_ID;
}

export function getV3ChainMetadata(chainId: number = v3Config.chainId) {
  const supportedChainId = isSupportedV3ChainId(chainId) ? chainId : V3_MAINNET_CHAIN_ID;
  return V3_CHAIN_METADATA[supportedChainId];
}

function isAddress(value: string | undefined): value is Address {
  return !!value && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function readAddress(value?: string): Address {
  return isAddress(value) ? value : ZERO_ADDRESS;
}

function isConfiguredAddress(value: Address): boolean {
  return value !== ZERO_ADDRESS;
}

type V3ChainEnvKey =
  | 'RPC_URL'
  | 'ALCHEMIST_ADDRESS'
  | 'POSITION_NFT_ADDRESS'
  | 'TRANSMUTER_ADDRESS'
  | 'DEBT_TOKEN_ADDRESS'
  | 'UNDERLYING_TOKEN_ADDRESS'
  | 'MYT_ADDRESS';

function readChainEnv(chainId: SupportedV3ChainId, key: V3ChainEnvKey): string | undefined {
  if (chainId === V3_MAINNET_CHAIN_ID) {
    switch (key) {
      case 'RPC_URL':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_RPC_URL;
      case 'ALCHEMIST_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_ALCHEMIST_ADDRESS;
      case 'POSITION_NFT_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_POSITION_NFT_ADDRESS;
      case 'TRANSMUTER_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_TRANSMUTER_ADDRESS;
      case 'DEBT_TOKEN_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_DEBT_TOKEN_ADDRESS;
      case 'UNDERLYING_TOKEN_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_UNDERLYING_TOKEN_ADDRESS;
      case 'MYT_ADDRESS':
        return process.env.NEXT_PUBLIC_ALCHEMIX_V3_MAINNET_MYT_ADDRESS;
      default:
        return undefined;
    }
  }

  switch (key) {
    case 'RPC_URL':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_RPC_URL;
    case 'ALCHEMIST_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_ALCHEMIST_ADDRESS;
    case 'POSITION_NFT_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_POSITION_NFT_ADDRESS;
    case 'TRANSMUTER_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_TRANSMUTER_ADDRESS;
    case 'DEBT_TOKEN_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_DEBT_TOKEN_ADDRESS;
    case 'UNDERLYING_TOKEN_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_UNDERLYING_TOKEN_ADDRESS;
    case 'MYT_ADDRESS':
      return process.env.NEXT_PUBLIC_ALCHEMIX_V3_SEPOLIA_MYT_ADDRESS;
    default:
      return undefined;
  }
}

function readChainAddress(chainId: SupportedV3ChainId, key: V3ChainEnvKey): Address {
  return readAddress(readChainEnv(chainId, key));
}

function buildV3Config(chainId: SupportedV3ChainId): V3ProtocolConfig {
  const legacyChainId = readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID);
  const useLegacyFallback = chainId === legacyChainId;
  const chainAlchemistAddress = readChainAddress(chainId, 'ALCHEMIST_ADDRESS');
  const chainPositionNftAddress = readChainAddress(chainId, 'POSITION_NFT_ADDRESS');
  const chainTransmuterAddress = readChainAddress(chainId, 'TRANSMUTER_ADDRESS');
  const chainDebtTokenAddress = readChainAddress(chainId, 'DEBT_TOKEN_ADDRESS');
  const chainUnderlyingTokenAddress = readChainAddress(chainId, 'UNDERLYING_TOKEN_ADDRESS');
  const chainMytAddress = readChainAddress(chainId, 'MYT_ADDRESS');
  const alchemistAddress = isConfiguredAddress(chainAlchemistAddress)
    ? chainAlchemistAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS : undefined);
  const positionNftAddress = isConfiguredAddress(chainPositionNftAddress)
    ? chainPositionNftAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_POSITION_NFT_ADDRESS : undefined);
  const transmuterAddress = isConfiguredAddress(chainTransmuterAddress)
    ? chainTransmuterAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_TRANSMUTER_ADDRESS : undefined);
  const debtTokenAddress = isConfiguredAddress(chainDebtTokenAddress)
    ? chainDebtTokenAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_DEBT_TOKEN_ADDRESS : undefined);
  const underlyingTokenAddress = isConfiguredAddress(chainUnderlyingTokenAddress)
    ? chainUnderlyingTokenAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_UNDERLYING_TOKEN_ADDRESS : undefined);
  const mytAddress = isConfiguredAddress(chainMytAddress)
    ? chainMytAddress
    : readAddress(useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_MYT_ADDRESS : undefined);
  const rpcUrl =
    readChainEnv(chainId, 'RPC_URL') ||
    (useLegacyFallback ? process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL : undefined) ||
    null;

  return {
    enabled: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3),
    chainId,
    rpcUrl,
    alchemistAddress,
    positionNftAddress,
    transmuterAddress,
    debtTokenAddress,
    underlyingTokenAddress,
    mytAddress,
    isConfigured: [
      alchemistAddress,
      positionNftAddress,
      transmuterAddress,
      debtTokenAddress,
      underlyingTokenAddress,
    ].every(isConfiguredAddress),
  };
}

export const v3Configs: Record<SupportedV3ChainId, V3ProtocolConfig> = {
  [V3_MAINNET_CHAIN_ID]: buildV3Config(V3_MAINNET_CHAIN_ID),
  [V3_TESTNET_CHAIN_ID]: buildV3Config(V3_TESTNET_CHAIN_ID),
};

export function getV3Config(
  chainId: number = readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID),
): V3ProtocolConfig {
  const supportedChainId = isSupportedV3ChainId(chainId)
    ? chainId
    : readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID);
  return v3Configs[supportedChainId];
}

export const v3Config = getV3Config(readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID));

export function canUseContractV3(chainId: number = v3Config.chainId): boolean {
  const config = getV3Config(chainId);
  return config.isConfigured && !!config.rpcUrl;
}

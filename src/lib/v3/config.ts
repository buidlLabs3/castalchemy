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

const alchemistAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS);
const positionNftAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_POSITION_NFT_ADDRESS);
const transmuterAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_TRANSMUTER_ADDRESS);
const debtTokenAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_DEBT_TOKEN_ADDRESS);
const underlyingTokenAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_UNDERLYING_TOKEN_ADDRESS);
const mytAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MYT_ADDRESS);

export const v3Config: V3ProtocolConfig = {
  enabled: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3),
  chainId: readSupportedChainId(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID),
  rpcUrl: process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL || null,
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

export function canUseContractV3(): boolean {
  return v3Config.isConfigured && !!v3Config.rpcUrl;
}

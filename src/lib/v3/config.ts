import type { Address } from 'viem';
import type { V3AdapterMode, V3ProtocolConfig } from './types';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// ─── Known V3 Deployment Addresses (from alchemix-finance/v3 broadcast) ─────
// NOTE: These may change. Always verify against official Alchemix governance.
export const V3_KNOWN_DEPLOYMENTS: Record<number, { label: string; contracts: Partial<Record<string, Address>> }> = {
  1: {
    label: 'Ethereum Mainnet',
    contracts: {
      vaultV2Factory: '0xdd56b00302e91c4c2b8246156bdeaa1cedc58984' as Address,
      vaultV2_USDC: '0x9b44efca3e2a707b63dc00ce79d646e5e5d24ba5' as Address,
      vaultV2_WETH: '0x29bcfed246ce37319d94eba107db90c453d4c43d' as Address,
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

function isAddress(value: string | undefined): value is Address {
  return !!value && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function readAddress(value?: string): Address {
  return isAddress(value) ? value : ZERO_ADDRESS;
}

function readMode(value?: string): V3AdapterMode {
  return value === 'contracts' ? 'contracts' : 'mock';
}

function isConfiguredAddress(value: Address): boolean {
  return value !== ZERO_ADDRESS;
}

const mode = readMode(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MODE);
const alchemistAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_ALCHEMIST_ADDRESS);
const positionNftAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_POSITION_NFT_ADDRESS);
const transmuterAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_TRANSMUTER_ADDRESS);
const debtTokenAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_DEBT_TOKEN_ADDRESS);
const underlyingTokenAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_UNDERLYING_TOKEN_ADDRESS);
const mytAddress = readAddress(process.env.NEXT_PUBLIC_ALCHEMIX_V3_MYT_ADDRESS);

export const v3Config: V3ProtocolConfig = {
  enabled: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3),
  mode,
  chainId: readNumber(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID, 1),
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
  return v3Config.mode === 'contracts' && v3Config.isConfigured && !!v3Config.rpcUrl;
}

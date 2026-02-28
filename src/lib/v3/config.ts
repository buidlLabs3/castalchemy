import type { Address } from 'viem';
import type { V3AdapterMode, V3ProtocolConfig } from './types';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

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

export const v3Config: V3ProtocolConfig = {
  enabled: readBoolean(process.env.NEXT_PUBLIC_ENABLE_ALCHEMIX_V3),
  mode,
  chainId: readNumber(process.env.NEXT_PUBLIC_ALCHEMIX_V3_CHAIN_ID, 11155111),
  rpcUrl: process.env.NEXT_PUBLIC_ALCHEMIX_V3_RPC_URL || null,
  alchemistAddress,
  positionNftAddress,
  transmuterAddress,
  debtTokenAddress,
  underlyingTokenAddress,
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

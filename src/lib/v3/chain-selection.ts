'use client';

import { useEffect, useState } from 'react';
import { isSupportedV3ChainId, V3_MAINNET_CHAIN_ID, type SupportedV3ChainId, v3Config } from './config';

const STORAGE_KEY = 'castalchemy:v3-chain-id';

function normalizeChainId(value: string | number | null | undefined): SupportedV3ChainId {
  const parsed = Number(value);
  return isSupportedV3ChainId(parsed)
    ? parsed
    : isSupportedV3ChainId(v3Config.chainId)
      ? v3Config.chainId
      : V3_MAINNET_CHAIN_ID;
}

export function useSelectedV3ChainId() {
  const [selectedChainId, setSelectedChainIdState] = useState<SupportedV3ChainId>(
    normalizeChainId(v3Config.chainId),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setSelectedChainIdState(normalizeChainId(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  const setSelectedChainId = (chainId: string | number) => {
    const nextChainId = normalizeChainId(chainId);
    setSelectedChainIdState(nextChainId);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextChainId.toString());
    }
  };

  return {
    selectedChainId,
    setSelectedChainId,
  };
}

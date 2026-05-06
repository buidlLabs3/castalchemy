'use client';

import { useEffect, useState } from 'react';
import { isSupportedV3MarketId, v3Config } from './config';
import type { V3MarketId } from './types';

const STORAGE_KEY = 'castalchemy:v3-market-id';

function normalizeMarketId(value: string | null | undefined): V3MarketId {
  return isSupportedV3MarketId(value) ? value : v3Config.marketId;
}

export function useSelectedV3MarketId() {
  const [selectedMarketId, setSelectedMarketIdState] = useState<V3MarketId>(
    normalizeMarketId(v3Config.marketId),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setSelectedMarketIdState(normalizeMarketId(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  const setSelectedMarketId = (marketId: string) => {
    const nextMarketId = normalizeMarketId(marketId);
    setSelectedMarketIdState(nextMarketId);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextMarketId);
    }
  };

  return {
    selectedMarketId,
    setSelectedMarketId,
  };
}

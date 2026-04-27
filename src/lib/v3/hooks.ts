'use client';

import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { getV3Adapter } from './adapter';
import { v3Config } from './config';
import type { V3PositionDetail, V3PositionSummary, V3ProtocolState } from './types';

function formatHookError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown V3 integration error.';
}

export function useV3Positions(owner?: Address) {
  const [positions, setPositions] = useState<V3PositionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!v3Config.enabled || !owner) {
      setPositions([]);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const adapter = getV3Adapter();
    if (!adapter.isReady()) {
      setPositions([]);
      setError('Alchemix V3 contract mode is not configured yet.');
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);

    adapter
      .getPositions(owner)
      .then((nextPositions) => {
        if (cancelled) {
          return;
        }

        setPositions(nextPositions);
        setIsLoading(false);
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        setPositions([]);
        setError(formatHookError(nextError));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [owner, reloadKey]);

  return {
    positions,
    isLoading,
    error,
    isEnabled: v3Config.enabled,
    reload: () => setReloadKey((value) => value + 1),
  };
}

export function useV3Position(tokenId?: bigint, owner?: Address) {
  const [position, setPosition] = useState<V3PositionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!v3Config.enabled || tokenId === undefined) {
      setPosition(null);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const adapter = getV3Adapter();
    if (!adapter.isReady()) {
      setPosition(null);
      setError('Alchemix V3 contract mode is not configured yet.');
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);

    adapter
      .getPosition(tokenId, owner)
      .then((nextPosition) => {
        if (cancelled) {
          return;
        }

        setPosition(nextPosition);
        setIsLoading(false);
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        setPosition(null);
        setError(formatHookError(nextError));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [owner, tokenId, reloadKey]);

  return {
    position,
    isLoading,
    error,
    isEnabled: v3Config.enabled,
    reload: () => setReloadKey((value) => value + 1),
  };
}

export function useV3ProtocolState() {
  const [protocolState, setProtocolState] = useState<V3ProtocolState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (!v3Config.enabled) {
      setProtocolState(null);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const adapter = getV3Adapter();
    if (!adapter.isReady()) {
      setProtocolState(null);
      setError('Alchemix V3 contract mode is not configured yet.');
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError(null);

    adapter
      .getProtocolState()
      .then((nextState) => {
        if (cancelled) {
          return;
        }

        setProtocolState(nextState);
        setIsLoading(false);
      })
      .catch((nextError) => {
        if (cancelled) {
          return;
        }

        setProtocolState(null);
        setError(formatHookError(nextError));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    protocolState,
    isLoading,
    error,
    isEnabled: v3Config.enabled,
    reload: () => setReloadKey((value) => value + 1),
  };
}

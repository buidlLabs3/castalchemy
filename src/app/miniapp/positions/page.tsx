'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { formatEther, type Address } from 'viem';
import styles from '../page.module.css';
import { useWallet } from '@/lib/wallet/hooks';
import { getAlchemixClient } from '@/lib/contracts/alchemix';
import type { Position, VaultType } from '@/types';

function formatTokenAmount(weiString: string): string {
  try {
    return Number.parseFloat(formatEther(BigInt(weiString))).toFixed(4);
  } catch {
    return '0.0000';
  }
}

function formatHealth(value: number): string {
  if (!Number.isFinite(value)) {
    return '∞ (No debt)';
  }

  return value.toFixed(2);
}

function getHealthState(healthFactor: number): 'safe' | 'watch' | 'danger' {
  if (!Number.isFinite(healthFactor) || healthFactor >= 2.5) {
    return 'safe';
  }

  if (healthFactor >= 1.5) {
    return 'watch';
  }

  return 'danger';
}

interface PositionWithMeta extends Position {
  hasDeposit: boolean;
  hasDebt: boolean;
}

export default function PositionsPage() {
  const { address, isConnected, isConnecting } = useWallet();
  const [positions, setPositions] = useState<PositionWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    if (!address) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const vaultTypes: VaultType[] = ['alUSD', 'alETH'];
    const results: PositionWithMeta[] = [];

    for (const vaultType of vaultTypes) {
      try {
        const client = getAlchemixClient(vaultType);
        const position = await client.getPosition(address as Address, vaultType);

        if (position) {
          const deposited = BigInt(position.deposited);
          const borrowed = BigInt(position.borrowed);

          results.push({
            ...position,
            hasDeposit: deposited > 0n,
            hasDebt: borrowed > 0n,
          });
        }
      } catch (nextError) {
        console.error(`Failed to load ${vaultType} position:`, nextError);
        // Continue loading other vaults even if one fails
      }
    }

    if (results.length === 0) {
      setError('Could not load positions. The RPC endpoint may be unreachable or the vault addresses may not be configured.');
    }

    setPositions(results);
    setIsLoading(false);
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadPositions();
    }
  }, [isConnected, address, loadPositions]);

  const walletLabel = isConnecting
    ? 'Checking...'
    : isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Not connected';

  const totalDeposited = positions.reduce(
    (sum, p) => sum + BigInt(p.deposited),
    0n,
  );
  const totalBorrowed = positions.reduce(
    (sum, p) => sum + BigInt(p.borrowed),
    0n,
  );
  const activePositions = positions.filter((p) => p.hasDeposit || p.hasDebt);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Alchemix V2</span>
                <span className={styles.networkBadge}>Positions</span>
              </div>
              <h1 className={styles.heroTitle}>My Positions</h1>
              <p className={styles.heroSubtitle}>
                View your Alchemix V2 positions across all vault types. Monitor health, collateral,
                and outstanding debt.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Wallet</span>
              <strong>{walletLabel}</strong>
              <Link href="/miniapp" className={styles.secondaryButton}>
                Back to dashboard
              </Link>
            </div>
          </div>

          {isConnected && !isLoading && positions.length > 0 && (
            <div className={styles.metrics}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total deposited</span>
                <strong>{formatTokenAmount(totalDeposited.toString())}</strong>
                <span className={styles.metricFoot}>Across all vaults</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total borrowed</span>
                <strong>{formatTokenAmount(totalBorrowed.toString())}</strong>
                <span className={styles.metricFoot}>Outstanding debt</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Active vaults</span>
                <strong>{activePositions.length}</strong>
                <span className={styles.metricFoot}>
                  {activePositions.length === 0
                    ? 'No active positions'
                    : activePositions.map((p) => p.vaultType).join(', ')}
                </span>
              </div>
            </div>
          )}
        </section>

        {!isConnected || !address ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Wallet required</p>
                <h2 className={styles.panelTitle}>Connect your wallet to view positions</h2>
              </div>
            </div>
            <div className={styles.callout}>
              <strong>No wallet connected</strong>
              <span>
                Go back to the main dashboard and connect a wallet first, then return here to
                view your Alchemix V2 positions.
              </span>
            </div>
          </section>
        ) : (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>V2 vaults</p>
                  <h2 className={styles.panelTitle}>
                    {isLoading
                      ? 'Loading positions...'
                      : `${positions.length} vault(s) checked`}
                  </h2>
                </div>
                <button className={styles.iconButton} onClick={loadPositions}>
                  Refresh
                </button>
              </div>

              {error && (
                <div className={styles.callout}>
                  <strong>Loading issue</strong>
                  <span>{error}</span>
                </div>
              )}

              {isLoading && (
                <div className={styles.callout}>
                  Fetching your Alchemix V2 positions from the blockchain...
                </div>
              )}

              {!isLoading && positions.length > 0 && (
                <div className={styles.stackCompact}>
                  {positions.map((position) => {
                    const healthState = getHealthState(position.healthFactor);

                    return (
                      <div key={position.vaultType} className={styles.listCard}>
                        <div className={styles.listTop}>
                          <strong>{position.vaultType} Vault</strong>
                          <span
                            className={
                              healthState === 'safe'
                                ? styles.statusChipSafe
                                : healthState === 'watch'
                                  ? styles.statusChipWatch
                                  : styles.statusChipDanger
                            }
                          >
                            {healthState}
                          </span>
                        </div>

                        <div className={styles.v3Metrics}>
                          <span>Deposited: {formatTokenAmount(position.deposited)}</span>
                          <span>Borrowed: {formatTokenAmount(position.borrowed)}</span>
                          <span>Health: {formatHealth(position.healthFactor)}</span>
                          <span>
                            {position.hasDeposit
                              ? position.hasDebt
                                ? 'Active with debt'
                                : 'Deposited, no debt'
                              : 'No active deposit'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoading && positions.length === 0 && !error && (
                <div className={styles.callout}>
                  <strong>No positions found</strong>
                  <span>
                    This wallet does not have any Alchemix V2 positions yet. Deposit collateral to
                    get started.
                  </span>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Quick actions</p>
                  <h2 className={styles.panelTitle}>Manage your positions</h2>
                </div>
              </div>

              <div className={styles.actionGrid}>
                <Link className={styles.actionCard} href="/miniapp/deposit">
                  <span className={styles.actionEyebrow}>V2</span>
                  <strong>New deposit</strong>
                  <span>
                    Deposit collateral into an alUSD or alETH vault to start earning yield.
                  </span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/v3?action=deposit">
                  <span className={styles.actionEyebrow}>V3 preview</span>
                  <strong>V3 deposit</strong>
                  <span>
                    Use the V3 transaction builder to create a tokenId-backed position.
                  </span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/v3?action=borrow">
                  <span className={styles.actionEyebrow}>V3 preview</span>
                  <strong>Borrow</strong>
                  <span>
                    Mint synthetic assets against your V3 position available credit.
                  </span>
                </Link>
                <a
                  className={styles.actionCard}
                  href="/api/frames"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.actionEyebrow}>Frames</span>
                  <strong>Open frames</strong>
                  <span>
                    Interact with Alchemix through Farcaster Frames for deposit and position
                    management.
                  </span>
                </a>
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

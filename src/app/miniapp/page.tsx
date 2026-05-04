'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, type Address } from 'viem';
import styles from './page.module.css';
import { canUseContractV3, getV3ChainMetadata, useV3Positions, useV3ProtocolState } from '@/lib/v3';
import { fetchBalance } from '@/lib/wallet/balance';
import { useWallet } from '@/lib/wallet/hooks';

function formatTokenAmount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatHealth(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : 'INF';
}

function shortenAddress(address?: string): string {
  if (!address) {
    return 'Not connected';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function MiniApp() {
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const chain = getV3ChainMetadata();
  const {
    address,
    isConnected,
    isConnecting,
    walletMode,
    isFarcasterAvailable,
    switchToExternal,
    switchToFarcaster,
    disconnect,
  } = useWallet();
  const {
    positions,
    isLoading: positionsLoading,
    error: positionsError,
    reload: reloadPositions,
  } = useV3Positions(address);
  const {
    protocolState,
    isLoading: protocolLoading,
    error: protocolError,
    reload: reloadProtocol,
  } = useV3ProtocolState();

  const primaryPosition = positions[0] ?? null;
  const protocolPaused = !!protocolState && (protocolState.depositsPaused || protocolState.loansPaused);
  const walletSummary = isConnecting
    ? 'Checking wallet'
    : isConnected && address
      ? shortenAddress(address)
      : 'Connect wallet';

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
      } catch {
        // Outside Farcaster, the browser wallet flow remains available.
      }
    }

    initSDK();
  }, []);

  const loadBalance = async () => {
    if (!address) {
      return;
    }

    setBalanceLoading(true);
    setBalanceError(null);

    try {
      let provider:
        | { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
        | undefined;

      if (walletMode === 'farcaster') {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        provider = sdk.wallet?.ethProvider;
      } else if (typeof window !== 'undefined' && 'ethereum' in window) {
        const win = window as {
          ethereum?: {
            request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
          };
        };
        provider = win.ethereum;
      }

      setBalance(await fetchBalance(address as Address, provider));
    } catch (nextError) {
      console.error('Failed to load balance:', nextError);
      setBalanceError('Balance unavailable');
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, walletMode]);

  const copyAddress = async () => {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const reloadCoreData = () => {
    reloadProtocol();
    reloadPositions();
    loadBalance();
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>CastAlchemy</span>
                <span className={styles.networkBadge}>{chain.shortLabel}</span>
                <span className={styles.networkBadge}>{canUseContractV3() ? 'Live V3' : 'V3 not configured'}</span>
              </div>
              <h1 className={styles.heroTitle}>Alchemix V3 from Farcaster</h1>
              <p className={styles.heroSubtitle}>
                A focused command surface for deposits, borrowing, repayment, and position health on
                Ethereum mainnet or Sepolia.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Active wallet</span>
              <strong>{walletSummary}</strong>
              <span className={styles.walletHint}>
                {walletMode === 'farcaster'
                  ? 'Farcaster wallet'
                  : walletMode === 'external'
                    ? 'External wallet'
                    : 'No wallet selected'}
              </span>
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Network</span>
              <strong>{chain.shortLabel}</strong>
              <span className={styles.metricFoot}>{chain.label}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Protocol</span>
              <strong>{protocolPaused ? 'Paused' : protocolLoading ? 'Loading' : 'Operational'}</strong>
              <span className={styles.metricFoot}>
                {protocolState ? 'State loaded from V3 adapter' : 'Awaiting state'}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Positions</span>
              <strong>{positionsLoading ? '...' : positions.length}</strong>
              <span className={styles.metricFoot}>
                {primaryPosition ? `Primary #${primaryPosition.tokenId.toString()}` : 'None detected'}
              </span>
            </div>
          </div>
        </section>

        {!isConnected || !address ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Wallet setup</p>
                <h2 className={styles.panelTitle}>
                  {isConnecting ? 'Checking wallet providers' : 'Connect to continue'}
                </h2>
              </div>
            </div>

            {isConnecting ? (
              <div className={styles.callout}>Resolving Farcaster and browser wallet context.</div>
            ) : (
              <>
                <div className={styles.walletActions}>
                  <div className={styles.walletConnect}>
                    <ConnectButton />
                  </div>
                  {isFarcasterAvailable && (
                    <button className={styles.secondaryButton} onClick={switchToFarcaster}>
                      Use Farcaster wallet
                    </button>
                  )}
                  <button className={styles.ghostButton} onClick={switchToExternal}>
                    External wallet mode
                  </button>
                </div>
                <div className={styles.gridTwo}>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Production networks</span>
                    <strong>Mainnet and Sepolia only</strong>
                    <p>All wallet and frame transaction paths are constrained to Ethereum mainnet or Sepolia.</p>
                  </div>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Protocol scope</span>
                    <strong>Alchemix V3</strong>
                    <p>Older shortcuts redirect into the V3 position builder to avoid mixed protocol flows.</p>
                  </div>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Account</p>
                  <h2 className={styles.panelTitle}>Wallet overview</h2>
                </div>
                <button className={styles.iconButton} onClick={reloadCoreData}>
                  Refresh
                </button>
              </div>

              <div className={styles.accountCard}>
                <div>
                  <span className={styles.accountLabel}>{walletMode === 'farcaster' ? 'Farcaster' : 'External'}</span>
                  <strong className={styles.accountAddress}>{shortenAddress(address)}</strong>
                  <p className={styles.accountSubtle}>
                    {balanceLoading
                      ? 'Refreshing balance...'
                      : balanceError
                        ? balanceError
                        : balance
                          ? `${balance} ETH available`
                          : 'Balance not loaded yet'}
                  </p>
                </div>
                <div className={styles.accountButtons}>
                  <button className={styles.secondaryButton} onClick={copyAddress}>
                    {copied ? 'Copied' : 'Copy address'}
                  </button>
                  {walletMode !== 'farcaster' && isFarcasterAvailable && (
                    <button className={styles.ghostButton} onClick={switchToFarcaster}>
                      Farcaster wallet
                    </button>
                  )}
                  {walletMode !== 'external' && (
                    <button className={styles.ghostButton} onClick={switchToExternal}>
                      External wallet
                    </button>
                  )}
                  <button className={styles.ghostButton} onClick={disconnect}>
                    Disconnect
                  </button>
                </div>
              </div>
            </section>

            {(protocolError || positionsError) && (
              <div className={styles.callout}>
                <strong>Data issue</strong>
                <span>{protocolError ?? positionsError}</span>
              </div>
            )}

            {protocolPaused && (
              <div className={styles.callout}>
                <strong>Protocol pause detected</strong>
                <span>
                  {protocolState?.depositsPaused ? 'Deposits are paused. ' : ''}
                  {protocolState?.loansPaused ? 'Borrowing is paused.' : ''}
                </span>
              </div>
            )}

            <div className={styles.gridTwoWide}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Position health</p>
                    <h2 className={styles.panelTitle}>
                      {primaryPosition ? `Position #${primaryPosition.tokenId.toString()}` : 'No position selected'}
                    </h2>
                  </div>
                  <Link href="/miniapp/v3" className={styles.textLink}>
                    Open builder
                  </Link>
                </div>

                {primaryPosition ? (
                  <div className={styles.metricStack}>
                    <div className={styles.metricStrip}>
                      <span>Health factor</span>
                      <strong>{formatHealth(primaryPosition.healthFactor)}</strong>
                    </div>
                    <div className={styles.gridTwo}>
                      <div className={styles.infoTile}>
                        <span className={styles.infoLabel}>Collateral</span>
                        <strong>{formatTokenAmount(primaryPosition.collateral)}</strong>
                        <p>Debt: {formatTokenAmount(primaryPosition.debt)}</p>
                      </div>
                      <div className={styles.infoTile}>
                        <span className={styles.infoLabel}>Available credit</span>
                        <strong>{formatTokenAmount(primaryPosition.availableCredit)}</strong>
                        <p>Max withdraw: {formatTokenAmount(primaryPosition.maxWithdrawable)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.callout}>
                    {positionsLoading ? 'Loading positions...' : 'No V3 positions were found for this wallet.'}
                  </div>
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Protocol state</p>
                    <h2 className={styles.panelTitle}>V3 adapter snapshot</h2>
                  </div>
                </div>

                {protocolState ? (
                  <div className={styles.gridTwo}>
                    <div className={styles.infoTile}>
                      <span className={styles.infoLabel}>Deposited</span>
                      <strong>{formatTokenAmount(protocolState.totalDeposited)}</strong>
                      <p>Underlying value: {formatTokenAmount(protocolState.totalUnderlyingValue)}</p>
                    </div>
                    <div className={styles.infoTile}>
                      <span className={styles.infoLabel}>Debt</span>
                      <strong>{formatTokenAmount(protocolState.totalDebt)}</strong>
                      <p>Deposit cap: {formatTokenAmount(protocolState.depositCap)}</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.callout}>
                    {protocolLoading ? 'Loading protocol state...' : 'Protocol state unavailable.'}
                  </div>
                )}
              </section>
            </div>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Navigation</p>
                  <h2 className={styles.panelTitle}>Focused screens</h2>
                </div>
              </div>

              <div className={styles.actionGrid}>
                <Link className={styles.actionCard} href="/miniapp/v3?action=deposit">
                  <span className={styles.actionEyebrow}>V3</span>
                  <strong>Deposit</strong>
                  <span>Open or add to a tokenId-backed position.</span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/v3">
                  <span className={styles.actionEyebrow}>V3</span>
                  <strong>Manage positions</strong>
                  <span>Withdraw, borrow, repay, burn, or self-liquidate.</span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/analytics">
                  <span className={styles.actionEyebrow}>Insights</span>
                  <strong>Market and alerts</strong>
                  <span>Review yield snapshots, health alerts, and bot briefings.</span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/learn">
                  <span className={styles.actionEyebrow}>Guide</span>
                  <strong>Learn Alchemix</strong>
                  <span>Read the core V3 concepts without crowding the trading flow.</span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/social">
                  <span className={styles.actionEyebrow}>Growth</span>
                  <strong>Social tools</strong>
                  <span>Manage referral and tip-intent previews away from core positions.</span>
                </Link>
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

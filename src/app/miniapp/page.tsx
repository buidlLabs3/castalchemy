'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther, parseEther, type Address } from 'viem';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import styles from './page.module.css';
import { getBotBriefing, type BotBriefingKind } from '@/lib/automation/briefings';
import {
  getEducationLesson,
  getNextEducationStep,
  getPreviousEducationStep,
} from '@/lib/education/lessons';
import {
  formatMarketDelta,
  formatMarketPercent,
  formatMarketUsd,
  getMarketSnapshots,
} from '@/lib/market/snapshots';
import {
  formatSocialPercent,
  formatSocialUsd,
  getSocialPreview,
  type LeaderboardWindow,
  type SocialPrivacyMode,
} from '@/lib/social/preview';
import {
  formatTipAssetAmount,
  formatTipUsd,
  getTipAssetOptions,
  getTipConversionPreview,
  type TipAsset,
} from '@/lib/social/tips';
import { useV3Positions, v3Config } from '@/lib/v3';
import { fetchBalance } from '@/lib/wallet/balance';
import { useWallet } from '@/lib/wallet/hooks';

type FinancePanel = 'overview' | 'send' | 'receive';

interface ReferralSnapshot {
  code: string;
  clicks: number;
  conversions: number;
  conversionRate: number;
  projectedRewardUsd: number;
}

interface TipSummarySnapshot {
  totalIntents: number;
  totalIntendedUsd: number;
  totalProjectedDepositUsd: number;
}

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
  const [financePanel, setFinancePanel] = useState<FinancePanel>('overview');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [lessonStep, setLessonStep] = useState(1);
  const [briefingKind, setBriefingKind] = useState<BotBriefingKind>('daily');
  const [milestoneProgress, setMilestoneProgress] = useState(50);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>('weekly');
  const [socialPrivacyMode, setSocialPrivacyMode] = useState<SocialPrivacyMode>('public');
  const [socialComparisonEnabled, setSocialComparisonEnabled] = useState(true);
  const [tipAsset, setTipAsset] = useState<TipAsset>('USDC');
  const [tipAmount, setTipAmount] = useState('25');
  const [trackedReferral, setTrackedReferral] = useState<ReferralSnapshot | null>(null);
  const [tipSummary, setTipSummary] = useState<TipSummarySnapshot | null>(null);
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [tipTrackingBusy, setTipTrackingBusy] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<string | null>(null);

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
  const { sendTransaction, data: txHash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const {
    positions: v3Positions,
    isLoading: v3Loading,
    error: v3Error,
    isEnabled: isV3Enabled,
    reload: reloadV3,
  } = useV3Positions(address);

  const activeLesson = getEducationLesson(lessonStep);
  const previewPosition = v3Positions[0] ?? null;
  const previewHealthState = previewPosition?.healthState ?? 'safe';
  const activeBriefing = getBotBriefing(briefingKind, {
    healthState: previewHealthState,
    progress: milestoneProgress,
  });
  const socialPreview = getSocialPreview({
    window: leaderboardWindow,
    privacyMode: socialPrivacyMode,
    socialComparisonEnabled,
  });
  const tipOptions = getTipAssetOptions();
  const tipPreview = getTipConversionPreview({
    asset: tipAsset,
    amount: tipAmount,
  });
  const connectedWalletLabel = isConnecting
    ? 'Checking wallet'
    : isConnected && address
      ? shortenAddress(address)
      : 'Connect wallet';
  const referralSummary = trackedReferral ?? socialPreview.referral;

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        sdk.actions.ready();
      } catch {
        // Outside Farcaster, keep the page usable.
      }
    }

    initSDK();
  }, []);

  const refreshTracking = async () => {
    const search = new URLSearchParams({
      window: leaderboardWindow,
      privacy: socialPrivacyMode,
      compare: socialComparisonEnabled ? 'on' : 'off',
      code: referralSummary.code,
    });
    const [socialResponse, tipsResponse] = await Promise.all([
      fetch(`/api/social?${search.toString()}`, { method: 'GET' }),
      fetch(`/api/tips?asset=${tipAsset}&amount=${tipAmount}&code=${referralSummary.code}`, {
        method: 'GET',
      }),
    ]);

    if (socialResponse.ok) {
      const payload = (await socialResponse.json()) as {
        social?: { referral?: ReferralSnapshot };
        tracking?: { tipIntents?: number };
      };
      if (payload.social?.referral) {
        setTrackedReferral(payload.social.referral);
      }
      if (payload.tracking?.tipIntents !== undefined) {
        setTipSummary((current) => ({
          totalIntents: payload.tracking?.tipIntents ?? 0,
          totalIntendedUsd: current?.totalIntendedUsd ?? 0,
          totalProjectedDepositUsd: current?.totalProjectedDepositUsd ?? 0,
        }));
      }
    }

    if (tipsResponse.ok) {
      const payload = (await tipsResponse.json()) as {
        summary?: TipSummarySnapshot;
      };
      if (payload.summary) {
        setTipSummary(payload.summary);
      }
    }
  };

  useEffect(() => {
    refreshTracking().catch((error) => {
      console.error('Failed to refresh tracking:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardWindow, socialPrivacyMode, socialComparisonEnabled, tipAsset, tipAmount]);

  const trackReferralAction = async (action: 'click' | 'conversion') => {
    setTrackingBusy(true);
    setTrackingMessage(null);

    try {
      const response = await fetch('/api/social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          code: referralSummary.code,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to track referral action.');
      }

      const payload = (await response.json()) as {
        referral?: ReferralSnapshot;
      };

      if (payload.referral) {
        setTrackedReferral(payload.referral);
      }
      setTrackingMessage(action === 'click' ? 'Referral click tracked.' : 'Referral conversion tracked.');
    } catch (error) {
      console.error(error);
      setTrackingMessage('Failed to track referral action.');
    } finally {
      setTrackingBusy(false);
    }
  };

  const trackTipIntent = async () => {
    setTipTrackingBusy(true);
    setTrackingMessage(null);

    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: tipAsset,
          amount: tipAmount,
          wallet: address ?? null,
          referralCode: referralSummary.code,
        }),
      });

      if (!response.ok) {
        throw new Error('Unable to track tip intent.');
      }

      const payload = (await response.json()) as {
        event?: { id: string };
        summary?: TipSummarySnapshot;
        referral?: ReferralSnapshot;
      };

      if (payload.summary) {
        setTipSummary(payload.summary);
      }
      if (payload.referral) {
        setTrackedReferral(payload.referral);
      }

      setTrackingMessage(
        payload.event ? `Tip intent recorded (${payload.event.id.slice(0, 12)}...)` : 'Tip intent recorded.',
      );
    } catch (error) {
      console.error(error);
      setTrackingMessage('Failed to track tip intent.');
    } finally {
      setTipTrackingBusy(false);
    }
  };

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

      const nextBalance = await fetchBalance(address as Address, provider);
      setBalance(nextBalance);
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

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      loadBalance();
      setRecipient('');
      setAmount('');
      setFinancePanel('overview');
    }, 1800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const copyAddress = async () => {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1600);
  };

  const handleSend = () => {
    if (!recipient || !amount) {
      return;
    }

    sendTransaction({
      to: recipient as Address,
      value: parseEther(amount),
    });
  };

  const financeStatus = isPending
    ? 'Sending transfer...'
    : isConfirming
      ? 'Waiting for confirmation...'
      : isSuccess
        ? 'Transfer confirmed.'
        : error
          ? error.message
          : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Alchemix x Farcaster</span>
                <span className={styles.networkBadge}>Sepolia preview</span>
              </div>
              <h1 className={styles.heroTitle}>CastAlchemy</h1>
              <p className={styles.heroSubtitle}>
                A cleaner, contract-light dashboard focused on the flows we can ship before V3
                contracts land.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Active wallet</span>
              <strong>{connectedWalletLabel}</strong>
              <span className={styles.walletHint}>
                {walletMode === 'farcaster'
                  ? 'Using Farcaster wallet'
                  : walletMode === 'external'
                    ? 'Using external wallet'
                    : 'Choose Farcaster or external'}
              </span>
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>V3 mode</span>
              <strong>{v3Config.mode}</strong>
              <span className={styles.metricFoot}>
                {isV3Enabled ? 'Feature flag enabled' : 'Feature flag disabled'}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Positions</span>
              <strong>{v3Positions.length}</strong>
              <span className={styles.metricFoot}>
                {previewPosition ? `Watching #${previewPosition.tokenId}` : 'No preview positions yet'}
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Tip-ready</span>
              <strong>{tipPreview.asset}</strong>
              <span className={styles.metricFoot}>
                {formatTipAssetAmount(tipPreview.asset, tipPreview.normalizedAmount)} selected
              </span>
            </div>
          </div>
        </section>

        {!isConnected || !address ? (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Wallet setup</p>
                  <h2 className={styles.panelTitle}>
                    {isConnecting ? 'Checking wallet providers' : 'Choose how to connect'}
                  </h2>
                </div>
              </div>

              {isConnecting ? (
                <div className={styles.callout}>
                  We are resolving Farcaster context and external wallet availability before showing
                  actions.
                </div>
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
                      <span className={styles.infoLabel}>Live now</span>
                      <strong>Frames + analytics</strong>
                      <p>Market, education, alerts, and social preview work without final V3.</p>
                    </div>
                    <div className={styles.infoTile}>
                      <span className={styles.infoLabel}>On deck</span>
                      <strong>Tip-to-invest + referrals</strong>
                      <p>We can keep shipping social and wallet flows while contracts stay private.</p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </section>
        ) : (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Wallet desk</p>
                  <h2 className={styles.panelTitle}>Account overview</h2>
                </div>
                <button className={styles.iconButton} onClick={copyAddress}>
                  {copied ? 'Copied' : 'Copy address'}
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
                  <button className={styles.secondaryButton} onClick={loadBalance}>
                    Refresh
                  </button>
                  {walletMode !== 'farcaster' && isFarcasterAvailable && (
                    <button className={styles.ghostButton} onClick={switchToFarcaster}>
                      Switch to Farcaster
                    </button>
                  )}
                  {walletMode !== 'external' && (
                    <button className={styles.ghostButton} onClick={switchToExternal}>
                      Switch to external
                    </button>
                  )}
                  <button className={styles.ghostButton} onClick={disconnect}>
                    Disconnect
                  </button>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Money movement</p>
                  <h2 className={styles.panelTitle}>Transfer and receive</h2>
                </div>
              </div>

              <div className={styles.toggleRow}>
                {(['overview', 'send', 'receive'] as FinancePanel[]).map((panel) => (
                  <button
                    key={panel}
                    className={panel === financePanel ? styles.segmentActive : styles.segment}
                    onClick={() => setFinancePanel(panel)}
                  >
                    {panel === 'overview' ? 'Overview' : panel === 'send' ? 'Send' : 'Receive'}
                  </button>
                ))}
              </div>

              {financePanel === 'overview' && (
                <div className={styles.gridTwo}>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Quick transfer</span>
                    <strong>Send ETH on Sepolia</strong>
                    <p>Move funds from the connected wallet while V3 logic stays in preview mode.</p>
                    <button className={styles.primaryButton} onClick={() => setFinancePanel('send')}>
                      Open send form
                    </button>
                  </div>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Receive funds</span>
                    <strong>Share your wallet</strong>
                    <p>Copy the connected wallet to receive testnet funds or manual team payouts.</p>
                    <button className={styles.secondaryButton} onClick={() => setFinancePanel('receive')}>
                      Show receive info
                    </button>
                  </div>
                </div>
              )}

              {financePanel === 'send' && (
                <div className={styles.formCard}>
                  <label className={styles.field}>
                    <span>Recipient</span>
                    <input
                      className={styles.input}
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                      placeholder="0x..."
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Amount (ETH)</span>
                    <input
                      className={styles.input}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.10"
                    />
                  </label>
                  <button
                    className={styles.primaryButton}
                    onClick={handleSend}
                    disabled={!recipient || !amount || isPending || isConfirming}
                  >
                    {isPending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Send ETH'}
                  </button>
                  {financeStatus && <div className={styles.notice}>{financeStatus}</div>}
                </div>
              )}

              {financePanel === 'receive' && (
                <div className={styles.callout}>
                  <strong>{shortenAddress(address)}</strong>
                  <span>Tap copy above to share the full address.</span>
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Quick actions</p>
                  <h2 className={styles.panelTitle}>Current product surfaces</h2>
                </div>
              </div>

              <div className={styles.actionGrid}>
                <Link className={styles.actionCard} href="/miniapp/v3?action=deposit">
                  <span className={styles.actionEyebrow}>Preview</span>
                  <strong>Deposit</strong>
                  <span>Open the V3 builder for new-position deposits.</span>
                </Link>
                <Link className={styles.actionCard} href="/miniapp/v3?action=borrow">
                  <span className={styles.actionEyebrow}>Preview</span>
                  <strong>Borrow</strong>
                  <span>Review borrow prep on the selected mock or contract-backed position.</span>
                </Link>
                <a className={styles.actionCard} href="/api/frames" target="_blank" rel="noopener noreferrer">
                  <span className={styles.actionEyebrow}>Frames</span>
                  <strong>Open frames</strong>
                  <span>Inspect the live Frog routes for analytics, learning, and social flows.</span>
                </a>
                <a className={styles.actionCard} href="/api/tips" target="_blank" rel="noopener noreferrer">
                  <span className={styles.actionEyebrow}>M3</span>
                  <strong>Tip preview</strong>
                  <span>Preview tip conversion without needing V3 contracts.</span>
                </a>
              </div>
            </section>

            {trackingMessage && (
              <div className={styles.callout}>
                <strong>Tracking update</strong>
                <span>{trackingMessage}</span>
              </div>
            )}

            <div className={styles.gridTwoWide}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Position watch</p>
                    <h2 className={styles.panelTitle}>V3 preview status</h2>
                  </div>
                  <button className={styles.iconButton} onClick={reloadV3}>
                    Reload
                  </button>
                </div>

                {!isV3Enabled && (
                  <div className={styles.callout}>
                    Enable <code className={styles.inlineCode}>NEXT_PUBLIC_ENABLE_ALCHEMIX_V3=true</code>{' '}
                    to turn on the tokenId-based preview flow.
                  </div>
                )}

                {isV3Enabled && previewPosition && (
                  <div className={styles.metricStack}>
                    <div className={styles.metricStrip}>
                      <span>Working position</span>
                      <strong>#{previewPosition.tokenId}</strong>
                    </div>
                    <div className={styles.gridTwo}>
                      <div className={styles.infoTile}>
                        <span className={styles.infoLabel}>Collateral</span>
                        <strong>{formatTokenAmount(previewPosition.collateral)} ETH</strong>
                        <p>Debt: {formatTokenAmount(previewPosition.debt)} ETH</p>
                      </div>
                      <div className={styles.infoTile}>
                        <span className={styles.infoLabel}>Available</span>
                        <strong>{formatTokenAmount(previewPosition.availableCredit)} ETH</strong>
                        <p>Health: {formatHealth(previewPosition.healthFactor)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {isV3Enabled && !previewPosition && !v3Loading && (
                  <div className={styles.callout}>No preview positions detected for this wallet yet.</div>
                )}

                {v3Loading && <div className={styles.callout}>Loading position preview...</div>}
                {v3Error && <div className={styles.callout}>{v3Error}</div>}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Tip-to-invest</p>
                    <h2 className={styles.panelTitle}>M3 conversion preview</h2>
                  </div>
                  <a
                    className={styles.textLink}
                    href={`/api/tips?asset=${tipAsset}&amount=${tipAmount}&code=${referralSummary.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tips API
                  </a>
                </div>

                <div className={styles.toggleRow}>
                  {tipOptions.map((option) => (
                    <button
                      key={option.asset}
                      className={option.asset === tipAsset ? styles.segmentActive : styles.segment}
                      onClick={() => setTipAsset(option.asset)}
                    >
                      {option.asset}
                    </button>
                  ))}
                </div>

                <label className={styles.field}>
                  <span>Tip amount</span>
                  <input
                    className={styles.input}
                    value={tipAmount}
                    onChange={(event) => setTipAmount(event.target.value)}
                    placeholder="25"
                  />
                </label>

                <div className={styles.gridTwo}>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Routed deposit</span>
                    <strong>{formatTipUsd(tipPreview.estimatedDepositUsd)}</strong>
                    <p>{tipPreview.routeLabel}</p>
                  </div>
                  <div className={styles.infoTile}>
                    <span className={styles.infoLabel}>Monthly yield</span>
                    <strong>{formatTipUsd(tipPreview.projectedMonthlyYieldUsd)}</strong>
                    <p>{tipPreview.destinationVault}</p>
                  </div>
                </div>

                <div className={styles.callout}>
                  <strong>{tipPreview.actionLabel}</strong>
                  <span>
                    Fee drag {formatTipUsd(tipPreview.routingFeeUsd)}. {tipPreview.note}
                  </span>
                </div>

                <div className={styles.dualActionRow}>
                  <button className={styles.secondaryButton} onClick={trackTipIntent} disabled={tipTrackingBusy}>
                    {tipTrackingBusy ? 'Tracking tip...' : 'Track tip intent'}
                  </button>
                  <span className={styles.metricFoot}>
                    Intents tracked: {tipSummary?.totalIntents ?? 0} | Deposits tracked:{' '}
                    {formatTipUsd(tipSummary?.totalProjectedDepositUsd ?? 0)}
                  </span>
                </div>
              </section>
            </div>

            <div className={styles.gridTwoWide}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Market pulse</p>
                    <h2 className={styles.panelTitle}>Current snapshot</h2>
                  </div>
                  <a className={styles.textLink} href="/api/market" target="_blank" rel="noopener noreferrer">
                    Market API
                  </a>
                </div>

                <div className={styles.stackCompact}>
                  {getMarketSnapshots().map((snapshot) => (
                    <div key={snapshot.symbol} className={styles.listCard}>
                      <div className={styles.listTop}>
                        <strong>{snapshot.label}</strong>
                        <span className={styles.inlineChip}>{snapshot.trend}</span>
                      </div>
                      <div className={styles.listMetrics}>
                        <span>APY {formatMarketPercent(snapshot.currentApy)}</span>
                        <span>7d {formatMarketDelta(snapshot.apyDelta7d)}</span>
                        <span>TVL {formatMarketUsd(snapshot.tvlUsd)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Learning path</p>
                    <h2 className={styles.panelTitle}>Protocol education</h2>
                  </div>
                  <a
                    className={styles.textLink}
                    href={`/api/education?step=${activeLesson.step}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lesson API
                  </a>
                </div>

                <div className={styles.lessonCard}>
                  <span className={styles.infoLabel}>
                    Lesson {activeLesson.step} of {activeLesson.totalSteps}
                  </span>
                  <strong>{activeLesson.title}</strong>
                  <p>{activeLesson.summary}</p>
                  <ul className={styles.bulletList}>
                    {activeLesson.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <div className={styles.dualActionRow}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setLessonStep(getPreviousEducationStep(activeLesson.step))}
                      disabled={activeLesson.step === 1}
                    >
                      Previous
                    </button>
                    <button
                      className={styles.primaryButton}
                      onClick={() =>
                        setLessonStep(
                          activeLesson.step === activeLesson.totalSteps
                            ? 1
                            : getNextEducationStep(activeLesson.step),
                        )
                      }
                    >
                      {activeLesson.step === activeLesson.totalSteps ? 'Restart' : 'Next'}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.gridTwoWide}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Social layer</p>
                    <h2 className={styles.panelTitle}>Leaderboard and referrals</h2>
                  </div>
                  <a
                    className={styles.textLink}
                    href={`/api/social?window=${leaderboardWindow}&privacy=${socialPrivacyMode}&compare=${
                      socialComparisonEnabled ? 'on' : 'off'
                    }&code=${referralSummary.code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Social API
                  </a>
                </div>

                <div className={styles.toggleRow}>
                  {(['weekly', 'monthly'] as LeaderboardWindow[]).map((window) => (
                    <button
                      key={window}
                      className={window === leaderboardWindow ? styles.segmentActive : styles.segment}
                      onClick={() => setLeaderboardWindow(window)}
                    >
                      {window}
                    </button>
                  ))}
                  <button
                    className={socialComparisonEnabled ? styles.segmentActive : styles.segment}
                    onClick={() => setSocialComparisonEnabled((value) => !value)}
                  >
                    {socialComparisonEnabled ? 'Compare on' : 'Compare off'}
                  </button>
                </div>

                <div className={styles.toggleRow}>
                  {(['public', 'anonymous'] as SocialPrivacyMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={mode === socialPrivacyMode ? styles.segmentActive : styles.segment}
                      onClick={() => setSocialPrivacyMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className={styles.stackCompact}>
                  {socialPreview.leaderboard.map((entry) => (
                    <div key={`${entry.rank}-${entry.displayName}`} className={styles.listCard}>
                      <div className={styles.listTop}>
                        <strong>
                          #{entry.rank} {entry.displayName}
                        </strong>
                        <span className={styles.inlineChip}>score {entry.score}</span>
                      </div>
                      <div className={styles.listMetrics}>
                        <span>{entry.handle}</span>
                        <span>{formatSocialUsd(entry.capitalUsd)}</span>
                        <span>{formatSocialPercent(entry.repaymentProgress)} repaid</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.callout}>
                  <strong>
                    Referral {referralSummary.code} | {referralSummary.conversions}/{referralSummary.clicks}
                  </strong>
                  <span>
                    {formatSocialPercent(referralSummary.conversionRate)} conversion rate,{' '}
                    {formatSocialUsd(referralSummary.projectedRewardUsd)} projected rewards. {socialPreview.note}
                  </span>
                </div>

                <div className={styles.dualActionRow}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => trackReferralAction('click')}
                    disabled={trackingBusy}
                  >
                    {trackingBusy ? 'Saving...' : 'Track click'}
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => trackReferralAction('conversion')}
                    disabled={trackingBusy}
                  >
                    {trackingBusy ? 'Saving...' : 'Track conversion'}
                  </button>
                </div>
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <p className={styles.eyebrow}>Automation</p>
                    <h2 className={styles.panelTitle}>Bot and alert queue</h2>
                  </div>
                  <a
                    className={styles.textLink}
                    href={`/api/bot?kind=${briefingKind}${
                      briefingKind === 'health' ? `&health=${previewHealthState}` : ''
                    }${briefingKind === 'milestone' ? `&progress=${milestoneProgress}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bot API
                  </a>
                </div>

                <div className={styles.toggleRow}>
                  {(['daily', 'health', 'milestone'] as BotBriefingKind[]).map((kind) => (
                    <button
                      key={kind}
                      className={kind === briefingKind ? styles.segmentActive : styles.segment}
                      onClick={() => setBriefingKind(kind)}
                    >
                      {kind}
                    </button>
                  ))}
                </div>

                {briefingKind === 'milestone' && (
                  <div className={styles.toggleRow}>
                    {[25, 50, 75, 100].map((value) => (
                      <button
                        key={value}
                        className={value === milestoneProgress ? styles.segmentActive : styles.segment}
                        onClick={() => setMilestoneProgress(value)}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.lessonCard}>
                  <span className={styles.infoLabel}>{activeBriefing.kind} scenario</span>
                  <strong>{activeBriefing.headline}</strong>
                  <p>{activeBriefing.summary}</p>
                  <ul className={styles.bulletList}>
                    {activeBriefing.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className={styles.calloutInline}>Suggested CTA: {activeBriefing.cta}</div>
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../page.module.css';
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
import { useWallet } from '@/lib/wallet/hooks';

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

export default function SocialPage() {
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

  const { address } = useWallet();
  const socialPreview = getSocialPreview({
    window: leaderboardWindow,
    privacyMode: socialPrivacyMode,
    socialComparisonEnabled,
  });
  const referralSummary = trackedReferral ?? socialPreview.referral;
  const tipOptions = getTipAssetOptions();
  const tipPreview = getTipConversionPreview({
    asset: tipAsset,
    amount: tipAmount,
  });

  useEffect(() => {
    const search = new URLSearchParams({
      window: leaderboardWindow,
      privacy: socialPrivacyMode,
      compare: socialComparisonEnabled ? 'on' : 'off',
      code: referralSummary.code,
    });

    async function refreshTracking() {
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
    }

    refreshTracking().catch((error) => {
      console.error('Failed to refresh social tracking:', error);
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

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Growth tools</span>
                <span className={styles.networkBadge}>Separated preview</span>
              </div>
              <h1 className={styles.heroTitle}>Social and tip-intent desk</h1>
              <p className={styles.heroSubtitle}>
                Referral, leaderboard, and tip-routing tools are isolated from the core position flow
                so production transactions stay clean.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Navigation</span>
              <Link href="/miniapp" className={styles.secondaryButton}>
                Dashboard
              </Link>
            </div>
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
                <p className={styles.eyebrow}>Leaderboard</p>
                <h2 className={styles.panelTitle}>Referral preview</h2>
              </div>
              <a
                className={styles.textLink}
                href={`/api/social?window=${leaderboardWindow}&privacy=${socialPrivacyMode}&compare=${
                  socialComparisonEnabled ? 'on' : 'off'
                }&code=${referralSummary.code}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                API
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
                <p className={styles.eyebrow}>Tip-to-invest</p>
                <h2 className={styles.panelTitle}>Intent preview</h2>
              </div>
              <a
                className={styles.textLink}
                href={`/api/tips?asset=${tipAsset}&amount=${tipAmount}&code=${referralSummary.code}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                API
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
              <strong>{formatTipAssetAmount(tipPreview.asset, tipPreview.normalizedAmount)}</strong>
              <span>
                Fee drag {formatTipUsd(tipPreview.routingFeeUsd)}. {tipPreview.note}
              </span>
            </div>

            <div className={styles.dualActionRow}>
              <button className={styles.secondaryButton} onClick={trackTipIntent} disabled={tipTrackingBusy}>
                {tipTrackingBusy ? 'Tracking tip...' : 'Track tip intent'}
              </button>
              <span className={styles.metricFoot}>
                Intents: {tipSummary?.totalIntents ?? 0} | Deposits:{' '}
                {formatTipUsd(tipSummary?.totalProjectedDepositUsd ?? 0)}
              </span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import styles from '../page.module.css';
import { getBotBriefing, type BotBriefingKind } from '@/lib/automation/briefings';
import {
  formatMarketDelta,
  formatMarketPercent,
  formatMarketUsd,
  getMarketSnapshots,
} from '@/lib/market/snapshots';

export default function AnalyticsPage() {
  const [briefingKind, setBriefingKind] = useState<BotBriefingKind>('daily');
  const [milestoneProgress, setMilestoneProgress] = useState(50);
  const [healthState, setHealthState] = useState<'safe' | 'watch' | 'danger'>('safe');
  const briefing = getBotBriefing(briefingKind, {
    healthState,
    progress: milestoneProgress,
  });

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Insights</span>
                <span className={styles.networkBadge}>Read-only</span>
              </div>
              <h1 className={styles.heroTitle}>Market and alert desk</h1>
              <p className={styles.heroSubtitle}>
                Yield snapshots and automation previews live here, away from transaction preparation.
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

        <div className={styles.gridTwoWide}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Market pulse</p>
                <h2 className={styles.panelTitle}>Vault snapshots</h2>
              </div>
              <a className={styles.textLink} href="/api/market" target="_blank" rel="noopener noreferrer">
                API
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
                  <p>{snapshot.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Automation</p>
                <h2 className={styles.panelTitle}>Bot briefing preview</h2>
              </div>
              <a
                className={styles.textLink}
                href={`/api/bot?kind=${briefingKind}${
                  briefingKind === 'health' ? `&health=${healthState}` : ''
                }${briefingKind === 'milestone' ? `&progress=${milestoneProgress}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                API
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

            {briefingKind === 'health' && (
              <div className={styles.toggleRow}>
                {(['safe', 'watch', 'danger'] as const).map((state) => (
                  <button
                    key={state}
                    className={state === healthState ? styles.segmentActive : styles.segment}
                    onClick={() => setHealthState(state)}
                  >
                    {state}
                  </button>
                ))}
              </div>
            )}

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
              <span className={styles.infoLabel}>{briefing.severity}</span>
              <strong>{briefing.headline}</strong>
              <p>{briefing.summary}</p>
              <ul className={styles.bulletList}>
                {briefing.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className={styles.calloutInline}>CTA: {briefing.cta}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
      } catch {
        // Browser access is supported outside Farcaster.
      } finally {
        setIsReady(true);
      }
    }

    initSDK();
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        color: 'var(--ink)',
      }}
    >
      <section
        style={{
          width: '100%',
          minHeight: 'calc(100vh - 48px)',
          display: 'grid',
          alignContent: 'center',
          gap: '28px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '32px',
          background:
            'linear-gradient(135deg, rgba(245, 192, 154, 0.08), rgba(114, 224, 178, 0.03) 48%, transparent), var(--surface-raised)',
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '4px 10px',
              borderRadius: 2,
              background: 'var(--brand-muted)',
              color: 'var(--brand-strong)',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Alchemix V3 on Farcaster
          </div>
          <h1
            style={{
              margin: '18px 0 0',
              fontSize: 42,
              lineHeight: 1.08,
              letterSpacing: 0,
              color: 'var(--ink-strong)',
            }}
          >
            CastAlchemy
          </h1>
          <p
            style={{
              maxWidth: 580,
              margin: '14px 0 0',
              color: 'var(--muted)',
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Manage Alchemix V3 positions, review protocol state, and prepare
            transactions from a Farcaster-ready interface.
          </p>
        </div>

        {isReady && (
          <Link
            href="/miniapp"
            style={{
              width: 'fit-content',
              padding: '10px 16px',
              borderRadius: 4,
              background: 'var(--brand)',
              color: '#101113',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Open Mini App
          </Link>
        )}
      </section>
    </main>
  );
}

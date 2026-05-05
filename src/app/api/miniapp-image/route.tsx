import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0a0a0a',
          color: '#f8fafc',
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          height: '100%',
          justifyContent: 'center',
          padding: 64,
          width: '100%',
        }}
      >
        <div
          style={{
            border: '2px solid #1f2937',
            borderRadius: 24,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            padding: 58,
            width: '100%',
          }}
        >
          <div style={{ color: '#fbbf24', fontSize: 34, fontWeight: 700, marginBottom: 34 }}>
            CastAlchemy
          </div>
          <div style={{ color: '#f8fafc', fontSize: 78, fontWeight: 800, lineHeight: 1.04, maxWidth: 820 }}>
            Alchemix V3 inside Farcaster
          </div>
          <div style={{ color: '#cbd5e1', fontSize: 34, lineHeight: 1.35, marginTop: 30, maxWidth: 820 }}>
            Manage positions, prepare transactions, and monitor health from a Mini App.
          </div>
          <div
            style={{
              background: '#fbbf24',
              borderRadius: 12,
              color: '#111827',
              display: 'flex',
              fontSize: 30,
              fontWeight: 800,
              marginTop: 48,
              padding: '18px 28px',
              width: 250,
            }}
          >
            Open App
          </div>
        </div>
      </div>
    ),
    {
      height: 800,
      width: 1200,
    },
  );
}

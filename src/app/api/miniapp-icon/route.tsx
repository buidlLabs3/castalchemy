import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#0a0a0a',
          color: '#fbbf24',
          display: 'flex',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 260,
          fontWeight: 900,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        CA
      </div>
    ),
    {
      height: 1024,
      width: 1024,
    },
  );
}

/**
 * Farcaster Frames API route
 * Main entry point for all Frame interactions
 */

import { Frog, Button } from 'frog';
import { handle } from 'frog/next';
import { depositFrame } from '@/lib/frames/deposit';
import { dashboardFrame } from '@/lib/frames/dashboard';

const app = new Frog({
  basePath: '/api/frames',
  // Hub will be set via environment variable
  hub: process.env.FARCASTER_HUB_URL || 'https://hubs.airstack.xyz',
});

// Main frame route
app.frame('/', (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#1a1a1a',
          color: '#ffffff',
          fontSize: 48,
          fontWeight: 'bold',
        }}
      >
        <div>⚗️ CastAlchemy</div>
        <div style={{ fontSize: 24, marginTop: 20, color: '#888' }}>
          Alchemix on Farcaster
        </div>
      </div>
    ),
    intents: [
      <Button.redirect key="deposit" location="/api/frames/deposit">
        Deposit
      </Button.redirect>,
      <Button.redirect key="dashboard" location="/api/frames/dashboard">
        My Positions
      </Button.redirect>,
    ],
  });
});

// Deposit frame route
app.frame('/deposit', depositFrame);

// Dashboard frame route
app.frame('/dashboard', dashboardFrame);

export const GET = handle(app);
export const POST = handle(app);


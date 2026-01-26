/**
 * Simplified Frame route without JSX to test if compilation works
 * This is a temporary workaround for SIGBUS issues
 */

import { Frog } from 'frog';
import { handle } from 'frog/next';

const app = new Frog({
  basePath: '/api/frames',
  hub: process.env.FARCASTER_HUB_URL || 'https://hubs.airstack.xyz',
});

app.frame('/', (c) => {
  return c.res({
    image: 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=CastAlchemy',
    intents: [
      {
        type: 'button',
        label: 'Deposit',
        action: {
          type: 'post',
          target: '/api/frames/deposit',
        },
      },
      {
        type: 'button',
        label: 'My Positions',
        action: {
          type: 'post',
          target: '/api/frames/dashboard',
        },
      },
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);




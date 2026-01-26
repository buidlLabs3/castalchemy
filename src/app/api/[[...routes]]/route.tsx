/** @jsxImportSource frog/jsx */
/**
 * Farcaster Frames API route
 * Main entry point for all Frame interactions
 * Using catch-all route pattern required by Frog framework
 */

import { Frog } from 'frog';
import { handle } from 'frog/next';
import { Button } from 'frog';

const app = new Frog({
  basePath: '/api',
  hub: process.env.FARCASTER_HUB_URL || 'https://hubs.airstack.xyz',
});

// Main frame route at /api/frames
app.frame('/frames', (c) => {
  return c.res({
    image: 'https://via.placeholder.com/600x400/1a1a1a/ffffff?text=CastAlchemy',
    intents: [
      <Button action="/frames/deposit">Deposit</Button>,
      <Button action="/frames/dashboard">My Positions</Button>,
    ],
  });
});

// Deposit frame route at /api/frames/deposit
app.frame('/frames/deposit', (c) => {
  return c.res({
    image: 'https://via.placeholder.com/600x400/1a1a1a/4ade80?text=Deposit+to+Alchemix',
    intents: [
      <Button action="/frames/deposit?vault=alusd">alUSD Vault</Button>,
      <Button action="/frames/deposit?vault=aleth">alETH Vault</Button>,
      <Button action="/frames">Back</Button>,
    ],
  });
});

// Dashboard frame route at /api/frames/dashboard
app.frame('/frames/dashboard', (c) => {
  return c.res({
    image: 'https://via.placeholder.com/600x400/1a1a1a/60a5fa?text=My+Positions',
    intents: [
      <Button action="/frames/dashboard">Refresh</Button>,
      <Button action="/frames/deposit">Deposit</Button>,
    ],
  });
});

// Export handlers - Frog requires catch-all route pattern
export const GET = handle(app);
export const POST = handle(app);

/**
 * Position Dashboard Frame - Shows user's Alchemix positions
 */

import { Button, type FrameHandler } from 'frog';
import { getAlchemixClient } from '@/lib/contracts/alchemix';
import { formatError } from '@/lib/utils/errors';
import { formatAmount, formatHealthFactor } from '@/lib/utils/format';

export const dashboardFrame: FrameHandler = async (c) => {
  const { buttonValue, status, verified } = c;

  // Check if user is verified (has connected wallet)
  if (!verified) {
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
            padding: 40,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>
            🔒 Connect Wallet
          </div>
          <div style={{ fontSize: 20, color: '#888', textAlign: 'center' }}>
            Please connect your wallet to view positions
          </div>
        </div>
      ),
      intents: [
        <Button key="connect" value="connect">
          Connect Wallet
        </Button>,
        <Button.redirect key="back" location="/api/frames">
          Back
        </Button.redirect>,
      ],
    });
  }

  // Fetch user positions
  try {
    const userAddress = c.frameData?.fid?.toString() || '';
    // TODO: Get actual address from Farcaster identity
    // For now, using FID as placeholder

    const alUSDClient = getAlchemixClient('alUSD');
    const alETHClient = getAlchemixClient('alETH');

    const [alUSDPosition, alETHPosition] = await Promise.all([
      alUSDClient.getPosition(userAddress as `0x${string}`, 'alUSD').catch(() => null),
      alETHClient.getPosition(userAddress as `0x${string}`, 'alETH').catch(() => null),
    ]);

    const hasPositions = alUSDPosition || alETHPosition;

    if (!hasPositions) {
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
              padding: 40,
            }}
          >
            <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>
              📊 No Positions
            </div>
            <div style={{ fontSize: 20, color: '#888', textAlign: 'center' }}>
              You don't have any active positions yet
            </div>
          </div>
        ),
      intents: [
        <Button.redirect key="deposit" location="/api/frames/deposit">
          Deposit Now
        </Button.redirect>,
      ],
      });
    }

    // Display positions
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            padding: 40,
            fontSize: 24,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 30 }}>
            📊 Your Positions
          </div>
          {alUSDPosition && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>alUSD</div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Deposited: {formatAmount(alUSDPosition.deposited)}
              </div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Borrowed: {formatAmount(alUSDPosition.borrowed)}
              </div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Health: {formatHealthFactor(alUSDPosition.healthFactor)}
              </div>
            </div>
          )}
          {alETHPosition && (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: 10 }}>alETH</div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Deposited: {formatAmount(alETHPosition.deposited)}
              </div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Borrowed: {formatAmount(alETHPosition.borrowed)}
              </div>
              <div style={{ color: '#888', fontSize: 20 }}>
                Health: {formatHealthFactor(alETHPosition.healthFactor)}
              </div>
            </div>
          )}
        </div>
      ),
      intents: [
        <Button key="refresh" value="refresh">
          Refresh
        </Button>,
        <Button.redirect key="deposit" location="/api/frames/deposit">
          Deposit
        </Button.redirect>,
      ],
    });
  } catch (error) {
    const errorMessage = formatError(error);
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
            color: '#ff4444',
            padding: 40,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 'bold', marginBottom: 20 }}>
            ❌ Error
          </div>
          <div style={{ fontSize: 20, textAlign: 'center' }}>{errorMessage}</div>
        </div>
      ),
      intents: [
        <Button key="retry" value="retry">
          Retry
        </Button>,
      ],
    });
  }
};



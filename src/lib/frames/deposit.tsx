/** @jsxImportSource frog/jsx */
/**
 * Deposit Frame - Allows users to deposit into Alchemix vaults
 */

import { Button, type FrameHandler } from 'frog';

export const depositFrame: FrameHandler = async (c) => {
  const { buttonValue, inputText, status } = c;

  // Initial state - show vault selection
  if (!status || status === 'initial') {
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
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
            ⚗️ Deposit to Alchemix
          </div>
          <div style={{ fontSize: 24, color: '#888', textAlign: 'center' }}>
            Choose a vault to deposit into
          </div>
        </div>
      ),
      intents: [
        <Button key="alusd" value="alusd">
          alUSD Vault
        </Button>,
        <Button key="aleth" value="aleth">
          alETH Vault
        </Button>,
        <Button.Redirect key="back" location="/api/frames">
          Back
        </Button.Redirect>,
      ],
    });
  }

  // Vault selected - show deposit form
  if (buttonValue === 'alusd' || buttonValue === 'aleth') {
    const vaultType = buttonValue === 'alusd' ? 'alUSD' : 'alETH';
    const vaultName = vaultType;

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
            Deposit to {vaultName}
          </div>
          <div style={{ fontSize: 20, color: '#888', marginBottom: 30 }}>
            Enter amount to deposit
          </div>
          {inputText && (
            <div style={{ fontSize: 24, color: '#4ade80', marginTop: 20 }}>
              Amount: {inputText}
            </div>
          )}
        </div>
      ),
      intents: [
        <Button.Transaction
          key="deposit"
          target={`/api/transactions/deposit?vault=${vaultType}&amount=${inputText || '0'}`}
        >
          Deposit
        </Button.Transaction>,
        <Button.Redirect key="back" location="/api/frames/deposit">
          Back
        </Button.Redirect>,
      ],
    });
  }

  // Transaction submitted - handle in transaction route instead
  // Status type doesn't include 'tx' in this version

  // Default back to initial
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
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
          ⚗️ Deposit to Alchemix
        </div>
        <div style={{ fontSize: 24, color: '#888', textAlign: 'center' }}>
          Choose a vault to deposit into
        </div>
      </div>
    ),
    intents: [
      <Button key="alusd" value="alusd">
        alUSD Vault
      </Button>,
      <Button key="aleth" value="aleth">
        alETH Vault
      </Button>,
      <Button.Redirect key="back" location="/api/frames">
        Back
      </Button.Redirect>,
    ],
  });
};


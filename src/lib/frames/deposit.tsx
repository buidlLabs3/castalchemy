/**
 * Deposit Frame - Allows users to deposit into Alchemix vaults
 */

import { Button, type FrameHandler } from 'frog';
import { getAlchemixClient } from '@/lib/contracts/alchemix';
import { formatError } from '@/lib/utils/errors';
import type { VaultType } from '@/types';

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
        <Button.redirect key="back" location="/api/frames">
          Back
        </Button.redirect>,
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
        <Button.redirect key="back" location="/api/frames/deposit">
          Back
        </Button.redirect>,
      ],
      textInput: 'Enter amount',
    });
  }

  // Transaction submitted
  if (status === 'tx') {
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
            ⏳ Processing...
          </div>
          <div style={{ fontSize: 20, color: '#888' }}>
            Confirm the transaction in your wallet
          </div>
        </div>
      ),
    });
  }

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
      <Button.redirect key="back" location="/api/frames">
        Back
      </Button.redirect>,
    ],
  });
};


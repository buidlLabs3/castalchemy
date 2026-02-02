/**
 * Wallet Test Page - Test wallet connectivity and basic transactions
 * Focus: Verify wallet integration before Alchemix V3 integration
 */
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet/hooks';
import { WalletButton } from '@/components/WalletButton';
import { formatEther, parseEther } from 'viem';
import { useBalance, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

export default function WalletTestPage() {
  const [isReady, setIsReady] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  
  const { address, isConnected, isFarcaster } = useWallet();
  const { data: balance } = useBalance({ address: address as `0x${string}` });
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
      } catch {
        // Not in Farcaster context
      }
      setIsReady(true);
    }
    initSDK();
  }, []);

  const handleSend = () => {
    if (!recipient || !amount) return;
    
    sendTransaction({
      to: recipient as `0x${string}`,
      value: parseEther(amount),
    });
  };

  if (!isReady) {
    return (
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}>
        <div>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '2rem',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🔐 Wallet Test
          </h1>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Test wallet connectivity and transactions
          </p>
        </div>

        {/* Wallet Connection */}
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#2a2a2a',
          borderRadius: '0.75rem',
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Connection Status
          </h2>
          
          <WalletButton />

          {isConnected && address && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Wallet Type:
                </div>
                <div style={{ fontWeight: 'bold', color: isFarcaster ? '#4ade80' : '#60a5fa' }}>
                  {isFarcaster ? '🟢 Farcaster Native Wallet' : '🔵 External Wallet (MetaMask/WC)'}
                </div>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  Address:
                </div>
                <div style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.9rem',
                  wordBreak: 'break-all',
                }}>
                  {address}
                </div>
              </div>

              {balance && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '0.5rem',
                }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    Balance:
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Send Transaction Test */}
        {isConnected && address && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.75rem',
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Send Test Transaction
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block',
                color: '#888',
                fontSize: '0.85rem',
                marginBottom: '0.5rem',
              }}>
                Recipient Address:
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={isPending || isConfirming}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '2px solid #4a4a4a',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block',
                color: '#888',
                fontSize: '0.85rem',
                marginBottom: '0.5rem',
              }}>
                Amount (ETH):
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending || isConfirming}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '2px solid #4a4a4a',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={!recipient || !amount || isPending || isConfirming}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: recipient && amount && !isPending && !isConfirming ? '#4ade80' : '#444',
                color: recipient && amount && !isPending && !isConfirming ? '#000' : '#888',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: recipient && amount && !isPending && !isConfirming ? 'pointer' : 'not-allowed',
              }}
            >
              {isPending ? '⏳ Confirming in wallet...' : 
               isConfirming ? '⏳ Waiting for confirmation...' : 
               isSuccess ? '✅ Transaction sent!' : 
               'Send Transaction'}
            </button>

            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#ff444420',
                border: '2px solid #ff4444',
                borderRadius: '0.5rem',
                color: '#ff6666',
                fontSize: '0.85rem',
              }}>
                ❌ {error.message}
              </div>
            )}

            {hash && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#4ade8020',
                border: '2px solid #4ade80',
                borderRadius: '0.5rem',
              }}>
                <div style={{ color: '#4ade80', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  ✅ Transaction Hash:
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  wordBreak: 'break-all',
                  marginBottom: '0.75rem',
                }}>
                  {hash}
                </div>
                <a
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#4ade80',
                    color: '#000',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                >
                  View on Etherscan →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div style={{
          padding: '1rem',
          backgroundColor: '#2a2a2a',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          color: '#888',
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            ℹ️ <strong>Wallet Test Features:</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            <li>Auto-detects Farcaster wallet or external wallet</li>
            <li>Shows wallet address and ETH balance</li>
            <li>Send test transactions on Ethereum mainnet</li>
            <li>View transaction on Etherscan</li>
          </ul>
        </div>

        {/* Back to Mini App */}
        <a
          href="/miniapp"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '1rem',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
          }}
        >
          ← Back to Mini App
        </a>
      </div>
    </main>
  );
}

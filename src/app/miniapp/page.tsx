/**
 * CastAlchemy - Unified Wallet Dashboard for Farcaster
 * Optimized for instant loading - no lag!
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet/hooks';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { Address } from 'viem';
import { fetchBalance } from '@/lib/wallet/balance';
import { useV3Positions, v3Config } from '@/lib/v3';
import {
  formatMarketDelta,
  formatMarketPercent,
  formatMarketUsd,
  getMarketSnapshots,
} from '@/lib/market/snapshots';
import {
  getEducationLesson,
  getNextEducationStep,
  getPreviousEducationStep,
} from '@/lib/education/lessons';
import { getBotBriefing, type BotBriefingKind } from '@/lib/automation/briefings';
import {
  formatSocialPercent,
  formatSocialUsd,
  getSocialPreview,
  type LeaderboardWindow,
  type SocialPrivacyMode,
} from '@/lib/social/preview';

function formatV3Amount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatV3Health(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

export default function MiniApp() {
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showWalletSwitch, setShowWalletSwitch] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [lessonStep, setLessonStep] = useState(1);
  const [briefingKind, setBriefingKind] = useState<BotBriefingKind>('daily');
  const [milestoneProgress, setMilestoneProgress] = useState(50);
  const [leaderboardWindow, setLeaderboardWindow] = useState<LeaderboardWindow>('weekly');
  const [socialPrivacyMode, setSocialPrivacyMode] = useState<SocialPrivacyMode>('public');
  const [socialComparisonEnabled, setSocialComparisonEnabled] = useState(true);
  
  const {
    address,
    isConnected,
    isConnecting,
    walletMode,
    isFarcasterAvailable,
    switchToExternal,
    switchToFarcaster,
    disconnect,
  } = useWallet();
  const { sendTransaction, data: txHash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const {
    positions: v3Positions,
    isLoading: v3Loading,
    error: v3Error,
    isEnabled: isV3Enabled,
    reload: reloadV3,
  } = useV3Positions(address);

  const previewPositions = v3Positions.slice(0, 2);
  const marketSnapshots = getMarketSnapshots();
  const activeLesson = getEducationLesson(lessonStep);
  const previewHealthState = previewPositions[0]?.healthState ?? 'safe';
  const activeBriefing = getBotBriefing(briefingKind, {
    healthState: previewHealthState,
    progress: milestoneProgress,
  });
  const socialPreview = getSocialPreview({
    window: leaderboardWindow,
    privacyMode: socialPrivacyMode,
    socialComparisonEnabled,
  });

  // Fast SDK initialization - non-blocking
  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        sdk.actions.ready();
      } catch {
        // Not in Farcaster, silently fail
      }
    }
    initSDK();
  }, []);

  // Custom balance fetcher that works with Farcaster wallet
  const loadBalance = async () => {
    if (!address) return;
    
    setBalanceLoading(true);
    setBalanceError(null);
    
    try {
      let provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
      
      // Get provider based on wallet mode
      if (walletMode === 'farcaster') {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        provider = sdk.wallet?.ethProvider;
      } else if (typeof window !== 'undefined' && 'ethereum' in window) {
        const win = window as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } };
        provider = win.ethereum;
      }
      
      const balanceStr = await fetchBalance(address as Address, provider);
      setBalance(balanceStr);
    } catch (error) {
      console.error('Failed to load balance:', error);
      setBalanceError('Failed to load balance');
    } finally {
      setBalanceLoading(false);
    }
  };

  // Load balance when address or wallet mode changes
  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, walletMode]);

  // Refresh balance after successful transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        loadBalance();
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    if (!recipient || !amount) return;
    
    sendTransaction({
      to: recipient as Address,
      value: parseEther(amount),
    });
  };

  const resetSend = () => {
    setShowSend(false);
    setRecipient('');
    setAmount('');
  };

  useEffect(() => {
    if (isSuccess) {
      setTimeout(resetSend, 3000);
    }
  }, [isSuccess]);

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      padding: '1rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          padding: '1.5rem 1rem 0.5rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚗️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
            CastAlchemy
          </h1>
          <div style={{
            display: 'inline-block',
            marginTop: '0.5rem',
            padding: '0.25rem 0.75rem',
            backgroundColor: '#fbbf24',
            color: '#000',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}>
            🧪 Sepolia Testnet
          </div>
        </div>

        {/* Wallet Card - Shows immediately */}
        {!isConnected || !address ? (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              {isConnecting ? '⏳' : walletMode === 'external' || !isFarcasterAvailable ? '🔗' : '🎭'}
            </div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              {isConnecting ? 'Checking Wallet...' :
               walletMode === 'external' ? 'Connect External Wallet' : 
               isFarcasterAvailable ? 'Connecting Farcaster Wallet...' : 
               'Connect Wallet'}
            </h2>
            {!isConnecting && (walletMode === 'external' || !isFarcasterAvailable) && (
              <>
                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1.5rem' }}>
                  Connect MetaMask or WalletConnect
                </p>
                <ConnectButton />
                {isFarcasterAvailable && (
                  <button
                    onClick={switchToFarcaster}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    ← Use Farcaster Wallet Instead
                  </button>
                )}
              </>
            )}
            {isConnecting && (
              <p style={{ fontSize: '0.9rem', opacity: 0.9, margin: 0 }}>
                Resolving wallet state before loading the dashboard.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Wallet Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    opacity: 0.9,
                    marginBottom: '0.25rem',
                  }}>
                    {walletMode === 'farcaster' ? '🎭 Farcaster Wallet' : '🔗 External Wallet'}
                  </div>
                  <div 
                    onClick={copyAddress}
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.9rem',
                      opacity: 0.9,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {address.slice(0, 6)}...{address.slice(-4)}
                    <span style={{ fontSize: '1rem' }}>{copied ? '✅' : '📋'}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWalletSwitch(!showWalletSwitch)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ Switch
                </button>
              </div>

              {/* Wallet Switcher */}
              {showWalletSwitch && (
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}>
                  <button
                    onClick={switchToFarcaster}
                    disabled={walletMode === 'farcaster'}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: walletMode === 'farcaster' ? '#4ade80' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: walletMode === 'farcaster' ? 'default' : 'pointer',
                    }}
                  >
                    🎭 Use Farcaster Wallet
                  </button>
                  <button
                    onClick={switchToExternal}
                    disabled={walletMode === 'external'}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: walletMode === 'external' ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: walletMode === 'external' ? 'default' : 'pointer',
                    }}
                  >
                    🔗 Use External Wallet
                  </button>
                  <button
                    onClick={disconnect}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255,68,68,0.2)',
                      color: '#ff4444',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    ⚠️ Disconnect
                  </button>
                </div>
              )}

              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ 
                  fontSize: '0.85rem', 
                  opacity: 0.9,
                  marginBottom: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>Total Balance</span>
                  <button
                    onClick={() => loadBalance()}
                    disabled={balanceLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      cursor: balanceLoading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      padding: '0.25rem',
                      opacity: balanceLoading ? 0.5 : 1,
                    }}
                    title="Refresh balance"
                  >
                    🔄
                  </button>
                </div>
                <div style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold',
                  letterSpacing: '-0.02em',
                }}>
                  {balanceLoading ? (
                    <span style={{ fontSize: '1.5rem', opacity: 0.6 }}>Loading...</span>
                  ) : balanceError ? (
                    <span style={{ fontSize: '1rem', color: '#ff4444' }}>Error</span>
                  ) : balance ? (
                    `${parseFloat(balance).toFixed(4)} ETH`
                  ) : (
                    '0.0000 ETH'
                  )}
                </div>
              </div>
              
              <div style={{ 
                fontSize: '0.85rem', 
                opacity: 0.8,
                marginBottom: '1rem',
              }}>
                {balanceError ? (
                  <div>
                    <span style={{ color: '#ff4444' }}>
                      ⚠️ {balanceError}
                    </span>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Click 🔄 to retry or check console
                    </div>
                  </div>
                ) : (
                  'Sepolia Testnet ETH (No real value)'
                )}
              </div>

              {/* Send/Receive Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
              }}>
                <button
                  onClick={() => { setShowSend(true); setShowReceive(false); }}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  📤 Send
                </button>
                <button
                  onClick={() => { setShowReceive(true); setShowSend(false); }}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  📥 Receive
                </button>
              </div>
            </div>

            {/* Send Modal */}
            {showSend && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                border: '2px solid #2a2a2a',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                    📤 Send ETH
                  </h2>
                  <button
                    onClick={() => setShowSend(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
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
                      backgroundColor: '#0f1419',
                      color: '#fff',
                      border: '2px solid #2a2a2a',
                      borderRadius: '0.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', color: '#888', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Amount (ETH):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isPending || isConfirming}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#0f1419',
                      color: '#fff',
                      border: '2px solid #2a2a2a',
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
                    cursor: recipient && amount && !isPending && !isConfirming ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isPending ? '⏳ Confirming...' : 
                   isConfirming ? '⏳ Sending...' : 
                   isSuccess ? '✅ Sent!' : 
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

                {txHash && (
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
                      {txHash}
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
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
                      View on Sepolia Etherscan →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Receive Modal */}
            {showReceive && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                border: '2px solid #2a2a2a',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
                    📥 Receive ETH
                  </h2>
                  <button
                    onClick={() => setShowReceive(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    backgroundColor: '#fff',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}`}
                      alt="QR Code"
                      style={{ width: '200px', height: '200px' }}
                    />
                  </div>
                  
                  <div style={{
                    backgroundColor: '#0f1419',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                  }}>
                    <div style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.9rem',
                      wordBreak: 'break-all',
                      marginBottom: '0.75rem',
                    }}>
                      {address}
                    </div>
                    <button
                      onClick={copyAddress}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4ade80',
                        color: '#000',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {copied ? '✅ Copied!' : '📋 Copy Address'}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#888' }}>
                    Scan QR code or copy address to receive ETH
                  </div>
                </div>
              </div>
            )}

            {/* Alchemix Positions */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1.25rem',
              padding: '1.5rem',
              border: '2px solid #2a2a2a',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}>
                <h2 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>💎</span> Alchemix Positions
                </h2>
                <Link
                  href="/miniapp/v3"
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Open V3 →
                </Link>
              </div>

              {isV3Enabled ? (
                <>
                  <div style={{
                    backgroundColor: '#0f1419',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    border: '1px solid #2a2a2a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>V3 Preview</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {v3Loading ? 'Loading positions...' : `${v3Positions.length} position${v3Positions.length === 1 ? '' : 's'}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.25rem' }}>
                        Mode: {v3Config.mode} on chain {v3Config.chainId}
                      </div>
                    </div>
                    <button
                      onClick={reloadV3}
                      disabled={v3Loading}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: v3Loading ? '#444' : '#4ade80',
                        color: v3Loading ? '#888' : '#000',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontWeight: 'bold',
                        cursor: v3Loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Refresh
                    </button>
                  </div>

                  {v3Error ? (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#ff444420',
                      border: '1px solid #ff4444',
                      color: '#ff8a8a',
                      fontSize: '0.85rem',
                    }}>
                      ⚠️ {v3Error}
                    </div>
                  ) : previewPositions.length > 0 ? (
                    <>
                      {previewPositions.map((position) => (
                        <div
                          key={position.tokenId.toString()}
                          style={{
                            backgroundColor: '#0f1419',
                            borderRadius: '0.75rem',
                            padding: '1rem',
                            marginBottom: '0.75rem',
                            border: '1px solid #2a2a2a',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem',
                            gap: '0.75rem',
                            flexWrap: 'wrap',
                          }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>Position #{position.tokenId.toString()}</div>
                              <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                Available credit: {formatV3Amount(position.availableCredit)}
                              </div>
                            </div>
                            <div style={{
                              padding: '0.25rem 0.6rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              backgroundColor:
                                position.healthState === 'safe'
                                  ? 'rgba(74,222,128,0.16)'
                                  : position.healthState === 'watch'
                                    ? 'rgba(251,191,36,0.16)'
                                    : 'rgba(248,113,113,0.16)',
                              color:
                                position.healthState === 'safe'
                                  ? '#86efac'
                                  : position.healthState === 'watch'
                                    ? '#fcd34d'
                                    : '#fca5a5',
                            }}>
                              {position.healthState}
                            </div>
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            fontSize: '0.85rem',
                          }}>
                            <div>
                              <div style={{ color: '#888' }}>Collateral</div>
                              <div style={{ fontWeight: 'bold' }}>{formatV3Amount(position.collateral)}</div>
                            </div>
                            <div>
                              <div style={{ color: '#888' }}>Debt</div>
                              <div style={{ fontWeight: 'bold' }}>{formatV3Amount(position.debt)}</div>
                            </div>
                            <div>
                              <div style={{ color: '#888' }}>Max Borrow</div>
                              <div style={{ fontWeight: 'bold' }}>{formatV3Amount(position.maxBorrowable)}</div>
                            </div>
                            <div>
                              <div style={{ color: '#888' }}>Health</div>
                              <div style={{ fontWeight: 'bold' }}>{formatV3Health(position.healthFactor)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {v3Positions.length > previewPositions.length && (
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          Showing the first {previewPositions.length} positions. Open V3 for the full list.
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      backgroundColor: '#0f1419',
                      border: '1px solid #2a2a2a',
                      color: '#888',
                      fontSize: '0.85rem',
                    }}>
                      No V3 positions found yet. Open the V3 screen to start with the new position-based flow.
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  backgroundColor: '#0f1419',
                  border: '1px solid #2a2a2a',
                  color: '#888',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}>
                  V3 preview is available but currently disabled. Set `NEXT_PUBLIC_ENABLE_ALCHEMIX_V3=true` to load the
                  new tokenId-based position flow.
                </div>
              )}
            </div>

            {/* Automation Preview */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '1rem',
              border: '2px solid #2a2a2a',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <h2 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>🤖</span> Bot Preview
                </h2>
                <a
                  href={`/api/bot?kind=${briefingKind}${briefingKind === 'health' ? `&health=${previewHealthState}` : ''}${
                    briefingKind === 'milestone' ? `&progress=${milestoneProgress}` : ''
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Bot API
                </a>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {(['daily', 'health', 'milestone'] as BotBriefingKind[]).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setBriefingKind(kind)}
                    style={{
                      flex: '1 1 100px',
                      padding: '0.7rem',
                      backgroundColor: briefingKind === kind ? '#60a5fa' : '#0f1419',
                      color: briefingKind === kind ? '#03141d' : '#fff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {kind}
                  </button>
                ))}
              </div>

              {briefingKind === 'milestone' && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                }}>
                  {[25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => setMilestoneProgress(value)}
                      style={{
                        flex: '1 1 80px',
                        padding: '0.6rem',
                        backgroundColor: milestoneProgress === value ? '#fbbf24' : '#0f1419',
                        color: milestoneProgress === value ? '#1a1201' : '#fff',
                        border: '1px solid #2a2a2a',
                        borderRadius: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                      }}
                    >
                      {value}%
                    </button>
                  ))}
                </div>
              )}

              <div style={{
                backgroundColor: '#0f1419',
                borderRadius: '0.75rem',
                padding: '1rem',
                border: '1px solid #2a2a2a',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem' }}>
                  {activeBriefing.kind} scenario
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>
                  {activeBriefing.headline}
                </div>
                <div style={{ color: '#d1d5db', lineHeight: 1.6, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  {activeBriefing.summary}
                </div>
                <div style={{
                  display: 'grid',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  marginBottom: '0.9rem',
                }}>
                  {activeBriefing.lines.map((line) => (
                    <div key={line}>• {line}</div>
                  ))}
                </div>
                <div style={{
                  padding: '0.65rem 0.8rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: '#d1d5db',
                  fontSize: '0.85rem',
                }}>
                  Suggested CTA: <strong>{activeBriefing.cta}</strong>
                </div>
              </div>
            </div>

            {/* Learning Path */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '1rem',
              border: '2px solid #2a2a2a',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <h2 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>🧠</span> Learning Path
                </h2>
                <a
                  href={`/api/education?step=${activeLesson.step}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Lesson API
                </a>
              </div>

              <div style={{
                backgroundColor: '#0f1419',
                borderRadius: '0.75rem',
                padding: '1rem',
                border: '1px solid #2a2a2a',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                      Lesson {activeLesson.step} of {activeLesson.totalSteps}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{activeLesson.title}</div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(192,132,252,0.16)',
                    color: '#d8b4fe',
                  }}>
                    tutorial
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {activeLesson.summary}
                </div>

                <div style={{
                  display: 'grid',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  marginBottom: '0.9rem',
                }}>
                  {activeLesson.bullets.map((bullet) => (
                    <div key={bullet}>• {bullet}</div>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => setLessonStep(getPreviousEducationStep(activeLesson.step))}
                    disabled={activeLesson.step === 1}
                    style={{
                      flex: '1 1 120px',
                      padding: '0.75rem',
                      backgroundColor: activeLesson.step === 1 ? '#444' : '#374151',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      cursor: activeLesson.step === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setLessonStep(
                        activeLesson.step === activeLesson.totalSteps
                          ? 1
                          : getNextEducationStep(activeLesson.step),
                      )
                    }
                    style={{
                      flex: '1 1 120px',
                      padding: '0.75rem',
                      backgroundColor: '#c084fc',
                      color: '#1f1330',
                      border: 'none',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    {activeLesson.step === activeLesson.totalSteps ? 'Restart' : 'Next Lesson'}
                  </button>
                </div>
              </div>
            </div>

            {/* Market Snapshot */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '1rem',
              border: '2px solid #2a2a2a',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <h2 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>📈</span> Market Snapshot
                </h2>
                <a
                  href="/api/market"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  API Preview
                </a>
              </div>
              <div style={{
                display: 'grid',
                gap: '0.75rem',
              }}>
                {marketSnapshots.map((snapshot) => (
                  <div
                    key={snapshot.symbol}
                    style={{
                      backgroundColor: '#0f1419',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      border: '1px solid #2a2a2a',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{snapshot.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{snapshot.note}</div>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor:
                          snapshot.trend === 'up'
                            ? 'rgba(74,222,128,0.16)'
                            : snapshot.trend === 'down'
                              ? 'rgba(248,113,113,0.16)'
                              : 'rgba(96,165,250,0.16)',
                        color:
                          snapshot.trend === 'up'
                            ? '#86efac'
                            : snapshot.trend === 'down'
                              ? '#fca5a5'
                              : '#93c5fd',
                      }}>
                        {snapshot.trend}
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '0.75rem',
                      fontSize: '0.85rem',
                    }}>
                      <div>
                        <div style={{ color: '#888' }}>Current APY</div>
                        <div style={{ fontWeight: 'bold' }}>{formatMarketPercent(snapshot.currentApy)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888' }}>7d Change</div>
                        <div style={{ fontWeight: 'bold' }}>{formatMarketDelta(snapshot.apyDelta7d)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888' }}>Utilization</div>
                        <div style={{ fontWeight: 'bold' }}>{formatMarketPercent(snapshot.utilization)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888' }}>TVL</div>
                        <div style={{ fontWeight: 'bold' }}>{formatMarketUsd(snapshot.tvlUsd)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Preview */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '1rem',
              padding: '1rem',
              border: '2px solid #2a2a2a',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <h2 style={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <span>🏆</span> Social Preview
                </h2>
                <a
                  href={`/api/social?window=${leaderboardWindow}&privacy=${socialPrivacyMode}&compare=${
                    socialComparisonEnabled ? 'on' : 'off'
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                  }}
                >
                  Social API
                </a>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {(['weekly', 'monthly'] as LeaderboardWindow[]).map((window) => (
                  <button
                    key={window}
                    onClick={() => setLeaderboardWindow(window)}
                    style={{
                      flex: '1 1 110px',
                      padding: '0.7rem',
                      backgroundColor: leaderboardWindow === window ? '#f472b6' : '#0f1419',
                      color: leaderboardWindow === window ? '#2c0a1b' : '#fff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {window}
                  </button>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {(['public', 'anonymous'] as SocialPrivacyMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSocialPrivacyMode(mode)}
                    style={{
                      flex: '1 1 110px',
                      padding: '0.7rem',
                      backgroundColor: socialPrivacyMode === mode ? '#c084fc' : '#0f1419',
                      color: socialPrivacyMode === mode ? '#210b35' : '#fff',
                      border: '1px solid #2a2a2a',
                      borderRadius: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode}
                  </button>
                ))}
                <button
                  onClick={() => setSocialComparisonEnabled((value) => !value)}
                  style={{
                    flex: '1 1 150px',
                    padding: '0.7rem',
                    backgroundColor: socialComparisonEnabled ? '#60a5fa' : '#374151',
                    color: socialComparisonEnabled ? '#03141d' : '#fff',
                    border: '1px solid #2a2a2a',
                    borderRadius: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  {socialComparisonEnabled ? 'Comparison On' : 'Comparison Off'}
                </button>
              </div>

              <div style={{
                display: 'grid',
                gap: '0.75rem',
              }}>
                {socialPreview.leaderboard.map((entry) => (
                  <div
                    key={`${socialPreview.window}-${entry.rank}`}
                    style={{
                      backgroundColor: '#0f1419',
                      borderRadius: '0.75rem',
                      padding: '1rem',
                      border: '1px solid #2a2a2a',
                      opacity: socialPreview.socialComparisonEnabled ? 1 : 0.7,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          #{entry.rank} {entry.displayName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>{entry.handle}</div>
                      </div>
                      <div style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(244,114,182,0.16)',
                        color: '#f9a8d4',
                      }}>
                        score {entry.score}
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '0.75rem',
                      fontSize: '0.85rem',
                    }}>
                      <div>
                        <div style={{ color: '#888' }}>Capital</div>
                        <div style={{ fontWeight: 'bold' }}>{formatSocialUsd(entry.capitalUsd)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888' }}>Repayment</div>
                        <div style={{ fontWeight: 'bold' }}>{formatSocialPercent(entry.repaymentProgress)}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{
                  backgroundColor: '#0f1419',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  border: '1px solid #2a2a2a',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Referral Preview</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        Code {socialPreview.referral.code}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(74,222,128,0.16)',
                      color: '#86efac',
                    }}>
                      {formatSocialUsd(socialPreview.referral.projectedRewardUsd)} projected
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.85rem',
                    marginBottom: '0.9rem',
                  }}>
                    <div>
                      <div style={{ color: '#888' }}>Clicks</div>
                      <div style={{ fontWeight: 'bold' }}>{socialPreview.referral.clicks}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888' }}>Conversions</div>
                      <div style={{ fontWeight: 'bold' }}>{socialPreview.referral.conversions}</div>
                    </div>
                    <div>
                      <div style={{ color: '#888' }}>Conversion Rate</div>
                      <div style={{ fontWeight: 'bold' }}>
                        {formatSocialPercent(socialPreview.referral.conversionRate)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: '#d1d5db',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                  }}>
                    Tip-ready assets: {socialPreview.referral.tipReadyAssets.join(', ')}. {socialPreview.note}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}>
              <Link
                href="/miniapp/v3?action=deposit"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#4ade80',
                  color: '#000',
                  border: 'none',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>💰</span>
                Deposit
              </Link>
              <Link
                href="/miniapp/v3?action=borrow"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#60a5fa',
                  color: '#000',
                  border: 'none',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🏦</span>
                Borrow
              </Link>
              <Link
                href="/miniapp/v3?action=withdraw"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#38bdf8',
                  color: '#03141d',
                  border: 'none',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>↘️</span>
                Withdraw
              </Link>
              <Link
                href="/miniapp/v3?action=repay"
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#fbbf24',
                  color: '#1a1201',
                  border: 'none',
                  borderRadius: '1rem',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>♻️</span>
                Repay
              </Link>
            </div>
          </>
        )}

        {/* Info Card */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '1rem',
          padding: '1rem',
          border: '2px solid #2a2a2a',
          fontSize: '0.85rem',
          color: '#888',
        }}>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#fff' }}>
            💡 How it works
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: 1.6 }}>
            <li>Connect a Farcaster or external wallet</li>
            <li>V3 positions are tokenId-based and can be multiple per wallet</li>
            <li>Preview positions now, then wire deposit and borrow flows on top</li>
            <li>Final contract addresses stay behind config until launch</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.8rem',
          color: '#666',
        }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem',
          }}>
            <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '0.25rem' }}>
              🧪 Running on Sepolia Testnet
            </div>
            <div style={{ fontSize: '0.75rem' }}>
              Get free testnet ETH from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80' }}>Sepolia Faucet</a>
            </div>
          </div>
          <div>Powered by CastAlchemy Preview</div>
          <div style={{ marginTop: '0.25rem' }}>V3 Integration: In Progress</div>
        </div>
      </div>
    </main>
  );
}

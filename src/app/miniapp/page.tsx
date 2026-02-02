/**
 * CastAlchemy - Unified Wallet Dashboard for Farcaster
 * All-in-one interface: Wallet + Alchemix positions + Actions
 */
'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/lib/wallet/hooks';
import { useBalance } from 'wagmi';
import { formatEther } from 'viem';
import type { Address } from 'viem';

export default function MiniApp() {
  const [isReady, setIsReady] = useState(false);
  
  const { address, isConnected, isConnecting } = useWallet();
  const { data: balance } = useBalance({ address: address as Address });

  useEffect(() => {
    async function initSDK() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        setIsReady(true);
      } catch (error) {
        console.error('SDK init failed:', error);
        setIsReady(true);
      }
    }
    initSDK();
  }, []);

  if (!isReady) {
    return (
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚗️</div>
          <div>Loading CastAlchemy...</div>
        </div>
      </main>
    );
  }

  if (isConnecting) {
    return (
      <main style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
          <div>Connecting wallet...</div>
        </div>
      </main>
    );
  }

  if (!isConnected || !address) {
    return (
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#0a0a0a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚗️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            CastAlchemy
          </h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            Self-repaying loans on Farcaster
          </p>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '1rem',
            border: '2px solid #2a2a2a',
          }}>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              Please open this Mini App in Farcaster to connect your wallet
            </p>
          </div>
        </div>
      </main>
    );
  }

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
          padding: '1.5rem 1rem 1rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚗️</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>
            CastAlchemy
          </h1>
        </div>

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
            marginBottom: '1.5rem',
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                opacity: 0.9,
                marginBottom: '0.25rem',
              }}>
                Farcaster Wallet
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.9rem',
                opacity: 0.9,
              }}>
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 'bold',
            }}>
              🎭 Connected
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ 
              fontSize: '0.85rem', 
              opacity: 0.9,
              marginBottom: '0.25rem',
            }}>
              Total Balance
            </div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              letterSpacing: '-0.02em',
            }}>
              {balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000'} ETH
            </div>
          </div>
          
          <div style={{ 
            fontSize: '0.85rem', 
            opacity: 0.8,
          }}>
            ≈ ${balance ? (parseFloat(formatEther(balance.value)) * 2500).toFixed(2) : '0.00'} USD
          </div>
        </div>

        {/* Alchemix Positions */}
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          border: '2px solid #2a2a2a',
        }}>
          <h2 style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>💎</span> Alchemix Positions
          </h2>

          {/* alUSD Vault */}
          <div style={{
            backgroundColor: '#0f1419',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '0.75rem',
            border: '1px solid #2a2a2a',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  $
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>alUSD Vault</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>Stablecoin</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Deposited</div>
                <div style={{ fontWeight: 'bold', color: '#4ade80' }}>$0.00</div>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}>
              <div>
                <div style={{ color: '#888' }}>Borrowed</div>
                <div style={{ fontWeight: 'bold' }}>$0.00</div>
              </div>
              <div>
                <div style={{ color: '#888' }}>Available</div>
                <div style={{ fontWeight: 'bold', color: '#4ade80' }}>$0.00</div>
              </div>
            </div>
          </div>

          {/* alETH Vault */}
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
              marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  Ξ
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>alETH Vault</div>
                  <div style={{ fontSize: '0.75rem', color: '#888' }}>Ethereum</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Deposited</div>
                <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>0.0000 ETH</div>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.85rem',
            }}>
              <div>
                <div style={{ color: '#888' }}>Borrowed</div>
                <div style={{ fontWeight: 'bold' }}>0.0000 ETH</div>
              </div>
              <div>
                <div style={{ color: '#888' }}>Available</div>
                <div style={{ fontWeight: 'bold', color: '#60a5fa' }}>0.0000 ETH</div>
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
          <button
            onClick={() => alert('Deposit functionality coming with Alchemix V3 on Feb 6th!')}
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
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>💰</span>
            Deposit
          </button>
          <button
            onClick={() => alert('Borrow functionality coming with Alchemix V3 on Feb 6th!')}
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
              transition: 'transform 0.2s',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🏦</span>
            Borrow
          </button>
        </div>

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
            <li>Deposit collateral (DAI, USDC, ETH)</li>
            <li>Borrow up to 50% as alUSD/alETH</li>
            <li>Your debt auto-repays from yield</li>
            <li>Withdraw anytime (V3 coming Feb 6th)</li>
          </ul>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.8rem',
          color: '#666',
        }}>
          <div>Powered by Alchemix V2</div>
          <div style={{ marginTop: '0.25rem' }}>V3 Integration: Feb 6th, 2026</div>
        </div>
      </div>
    </main>
  );
}

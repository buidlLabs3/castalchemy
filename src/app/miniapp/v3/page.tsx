'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatEther, parseEther } from 'viem';
import { useWallet } from '@/lib/wallet/hooks';
import { getV3Adapter, useV3Positions, v3Config } from '@/lib/v3';
import type { PreparedV3Transaction } from '@/lib/v3';

function formatTokenAmount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatHealth(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

export default function MiniAppV3PreviewPage() {
  const { address, isConnected } = useWallet();
  const { positions, isLoading, error, isEnabled, reload } = useV3Positions(address);
  const [depositAmount, setDepositAmount] = useState('1');
  const [borrowAmount, setBorrowAmount] = useState('0.25');
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [preparedTx, setPreparedTx] = useState<PreparedV3Transaction | null>(null);
  const [txLabel, setTxLabel] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (!positions.length) {
      setSelectedTokenId('');
      return;
    }

    if (!selectedTokenId || !positions.some((position) => position.tokenId.toString() === selectedTokenId)) {
      setSelectedTokenId(positions[0].tokenId.toString());
    }
  }, [positions, selectedTokenId]);

  const handlePrepareDeposit = async () => {
    if (!address) {
      setTxError('Connect a wallet before preparing a transaction.');
      return;
    }

    setIsPreparing(true);
    setTxError(null);

    try {
      const adapter = getV3Adapter();
      const tx = await adapter.prepareDeposit({
        amount: parseEther(depositAmount || '0'),
        recipient: address,
        recipientId: 0n,
      });

      setPreparedTx(tx);
      setTxLabel('Deposit (new position)');
    } catch (error) {
      setPreparedTx(null);
      setTxLabel(null);
      setTxError(error instanceof Error ? error.message : 'Failed to prepare deposit transaction.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePrepareBorrow = async () => {
    if (!address) {
      setTxError('Connect a wallet before preparing a transaction.');
      return;
    }

    if (!selectedTokenId) {
      setTxError('Choose a position before preparing a borrow transaction.');
      return;
    }

    setIsPreparing(true);
    setTxError(null);

    try {
      const adapter = getV3Adapter();
      const tx = await adapter.prepareMint({
        tokenId: BigInt(selectedTokenId),
        amount: parseEther(borrowAmount || '0'),
        recipient: address,
      });

      setPreparedTx(tx);
      setTxLabel(`Borrow from position #${selectedTokenId}`);
    } catch (error) {
      setPreparedTx(null);
      setTxLabel(null);
      setTxError(error instanceof Error ? error.message : 'Failed to prepare borrow transaction.');
    } finally {
      setIsPreparing(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        padding: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Alchemix V3 Preview
            </div>
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Read-Only Position Flow</h1>
          </div>
          <Link
            href="/miniapp"
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Back to Wallet
          </Link>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Feature Flag</div>
            <div style={{ fontWeight: 700 }}>{isEnabled ? 'Enabled' : 'Disabled'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Mode</div>
            <div style={{ fontWeight: 700 }}>{v3Config.mode}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Chain</div>
            <div style={{ fontWeight: 700 }}>{v3Config.chainId}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Wallet</div>
            <div style={{ fontWeight: 700 }}>
              {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </div>
          </div>
        </div>

        {!isEnabled && (
          <div
            style={{
              backgroundColor: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24',
              borderRadius: '1rem',
              padding: '1rem',
              lineHeight: 1.5,
            }}
          >
            Enable `NEXT_PUBLIC_ENABLE_ALCHEMIX_V3=true` in your local env to exercise the V3 adapter.
          </div>
        )}

        {isEnabled && !isConnected && (
          <div
            style={{
              backgroundColor: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.3)',
              color: '#93c5fd',
              borderRadius: '1rem',
              padding: '1rem',
              lineHeight: 1.5,
            }}
          >
            Connect a wallet in the main mini app first, then come back here to inspect V3 positions.
          </div>
        )}

        {isEnabled && isConnected && (
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '1rem',
              padding: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Positions</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>
                  {isLoading ? 'Loading...' : positions.length}
                </div>
              </div>
              <button
                onClick={reload}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: '#4ade80',
                  color: '#04130a',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Refresh
              </button>
            </div>

            {error && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255,68,68,0.12)',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            {!isLoading && positions.length === 0 && !error && (
              <div style={{ opacity: 0.75 }}>No V3 positions were found for this wallet.</div>
            )}

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {positions.map((position) => (
                <div
                  key={position.tokenId.toString()}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: '1rem',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Position #{position.tokenId.toString()}</div>
                    <div
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
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
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {position.healthState}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Collateral</div>
                      <div style={{ fontWeight: 700 }}>{formatTokenAmount(position.collateral)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Debt</div>
                      <div style={{ fontWeight: 700 }}>{formatTokenAmount(position.debt)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Available</div>
                      <div style={{ fontWeight: 700 }}>{formatTokenAmount(position.availableCredit)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Health</div>
                      <div style={{ fontWeight: 700 }}>{formatHealth(position.healthFactor)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isEnabled && isConnected && (
          <div
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: '1rem',
              padding: '1rem',
              display: 'grid',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                Transaction Prep
              </div>
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>V3 Action Builder</h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>New Deposit</div>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#0b0f14',
                    color: '#fff',
                    marginBottom: '0.75rem',
                  }}
                />
                <button
                  onClick={handlePrepareDeposit}
                  disabled={isPreparing}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing ? '#444' : '#4ade80',
                    color: isPreparing ? '#999' : '#04130a',
                    fontWeight: 700,
                    cursor: isPreparing ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Deposit
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Borrow From Position</div>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Position
                </label>
                <select
                  value={selectedTokenId}
                  onChange={(event) => setSelectedTokenId(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#0b0f14',
                    color: '#fff',
                    marginBottom: '0.75rem',
                  }}
                >
                  <option value="">Select a position</option>
                  {positions.map((position) => (
                    <option key={position.tokenId.toString()} value={position.tokenId.toString()}>
                      #{position.tokenId.toString()} ({formatTokenAmount(position.availableCredit)} available)
                    </option>
                  ))}
                </select>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={borrowAmount}
                  onChange={(event) => setBorrowAmount(event.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: '#0b0f14',
                    color: '#fff',
                    marginBottom: '0.75rem',
                  }}
                />
                <button
                  onClick={handlePrepareBorrow}
                  disabled={isPreparing || !positions.length}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !positions.length ? '#444' : '#60a5fa',
                    color: isPreparing || !positions.length ? '#999' : '#041320',
                    fontWeight: 700,
                    cursor: isPreparing || !positions.length ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Borrow
                </button>
              </div>
            </div>

            {txError && (
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255,68,68,0.12)',
                  color: '#fca5a5',
                }}
              >
                {txError}
              </div>
            )}

            {preparedTx && (
              <div
                style={{
                  backgroundColor: '#0b0f14',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
                  {txLabel ?? 'Prepared Transaction'}
                </div>
                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ opacity: 0.7 }}>Chain:</span> {preparedTx.chainId}
                  </div>
                  <div style={{ wordBreak: 'break-all' }}>
                    <span style={{ opacity: 0.7 }}>To:</span> {preparedTx.to}
                  </div>
                  <div>
                    <span style={{ opacity: 0.7 }}>Value:</span> {preparedTx.value.toString()}
                  </div>
                  <div style={{ wordBreak: 'break-all' }}>
                    <span style={{ opacity: 0.7 }}>Data:</span> {preparedTx.data}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

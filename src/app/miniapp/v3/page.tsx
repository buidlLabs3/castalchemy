'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatEther, parseEther } from 'viem';
import { useWallet } from '@/lib/wallet/hooks';
import { getV3Adapter, useV3Positions, v3Config, ZERO_ADDRESS } from '@/lib/v3';
import type { PreparedV3Transaction } from '@/lib/v3';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';

function formatTokenAmount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatHealth(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

function parseAmountInput(value: string): bigint | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  try {
    const parsed = parseEther(normalized);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

export default function MiniAppV3PreviewPage() {
  const searchParams = useSearchParams();
  const { address, isConnected, walletMode } = useWallet();
  const { positions, isLoading, error, isEnabled, reload } = useV3Positions(address);
  const { sendTransaction, data: txHash, error: sendError, isPending: isSending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [depositAmount, setDepositAmount] = useState('1');
  const [withdrawAmount, setWithdrawAmount] = useState('0.50');
  const [borrowAmount, setBorrowAmount] = useState('0.25');
  const [repayAmount, setRepayAmount] = useState('0.10');
  const [burnAmount, setBurnAmount] = useState('0.10');
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [preparedTx, setPreparedTx] = useState<PreparedV3Transaction | null>(null);
  const [txLabel, setTxLabel] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const requestedAction = searchParams.get('action');
  const preferredAction =
    requestedAction === 'withdraw' ||
    requestedAction === 'borrow' ||
    requestedAction === 'repay' ||
    requestedAction === 'burn'
      ? requestedAction
      : 'deposit';
  const selectedPosition = positions.find((position) => position.tokenId.toString() === selectedTokenId) ?? null;
  const depositAmountValue = parseAmountInput(depositAmount);
  const withdrawAmountValue = parseAmountInput(withdrawAmount);
  const borrowAmountValue = parseAmountInput(borrowAmount);
  const repayAmountValue = parseAmountInput(repayAmount);
  const burnAmountValue = parseAmountInput(burnAmount);
  const canPrepareDeposit = !!address && !!depositAmountValue;
  const canPrepareWithdraw =
    !!address &&
    !!selectedPosition &&
    !!withdrawAmountValue &&
    withdrawAmountValue <= selectedPosition.collateral;
  const canPrepareBorrow =
    !!address &&
    !!selectedPosition &&
    !!borrowAmountValue &&
    borrowAmountValue <= selectedPosition.availableCredit;
  const canPrepareRepay =
    !!selectedPosition &&
    !!repayAmountValue &&
    repayAmountValue <= selectedPosition.debt;
  const canPrepareBurn =
    !!selectedPosition &&
    !!burnAmountValue &&
    burnAmountValue <= selectedPosition.debt;
  const canSubmitPreparedTx =
    walletMode === 'external' &&
    !!preparedTx &&
    v3Config.mode === 'contracts' &&
    preparedTx.to !== ZERO_ADDRESS;

  useEffect(() => {
    if (!positions.length) {
      setSelectedTokenId('');
      return;
    }

    if (!selectedTokenId || !positions.some((position) => position.tokenId.toString() === selectedTokenId)) {
      setSelectedTokenId(positions[0].tokenId.toString());
    }
  }, [positions, selectedTokenId]);

  useEffect(() => {
    if (isSuccess) {
      reload();
    }
  }, [isSuccess, reload]);

  const prepareTransaction = async (
    label: string,
    build: () => Promise<PreparedV3Transaction>,
    fallbackError: string,
  ) => {
    setIsPreparing(true);
    setTxError(null);

    try {
      const tx = await build();
      setPreparedTx(tx);
      setTxLabel(label);
    } catch (error) {
      setPreparedTx(null);
      setTxLabel(null);
      setTxError(error instanceof Error ? error.message : fallbackError);
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePrepareDeposit = async () => {
    if (!address) {
      setTxError('Connect a wallet before preparing a transaction.');
      return;
    }

    if (!depositAmountValue) {
      setTxError('Enter a valid deposit amount greater than zero.');
      return;
    }

    await prepareTransaction(
      'Deposit (new position)',
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareDeposit({
          amount: depositAmountValue,
          recipient: address,
          recipientId: 0n,
        });
      },
      'Failed to prepare deposit transaction.',
    );
  };

  const handlePrepareWithdraw = async () => {
    if (!address) {
      setTxError('Connect a wallet before preparing a transaction.');
      return;
    }

    if (!selectedTokenId) {
      setTxError('Choose a position before preparing a withdraw transaction.');
      return;
    }

    if (!selectedPosition) {
      setTxError('The selected position could not be loaded.');
      return;
    }

    if (!withdrawAmountValue) {
      setTxError('Enter a valid withdraw amount greater than zero.');
      return;
    }

    if (withdrawAmountValue > selectedPosition.collateral) {
      setTxError('Withdraw amount exceeds the selected position collateral.');
      return;
    }

    await prepareTransaction(
      `Withdraw from position #${selectedTokenId}`,
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareWithdraw({
          tokenId: BigInt(selectedTokenId),
          amount: withdrawAmountValue,
          recipient: address,
        });
      },
      'Failed to prepare withdraw transaction.',
    );
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

    if (!selectedPosition) {
      setTxError('The selected position could not be loaded.');
      return;
    }

    if (!borrowAmountValue) {
      setTxError('Enter a valid borrow amount greater than zero.');
      return;
    }

    if (borrowAmountValue > selectedPosition.availableCredit) {
      setTxError('Borrow amount exceeds the selected position available credit.');
      return;
    }

    await prepareTransaction(
      `Borrow from position #${selectedTokenId}`,
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareMint({
          tokenId: BigInt(selectedTokenId),
          amount: borrowAmountValue,
          recipient: address,
        });
      },
      'Failed to prepare borrow transaction.',
    );
  };

  const handlePrepareRepay = async () => {
    if (!selectedTokenId) {
      setTxError('Choose a position before preparing a repay transaction.');
      return;
    }

    if (!selectedPosition) {
      setTxError('The selected position could not be loaded.');
      return;
    }

    if (!repayAmountValue) {
      setTxError('Enter a valid repay amount greater than zero.');
      return;
    }

    if (repayAmountValue > selectedPosition.debt) {
      setTxError('Repay amount exceeds the selected position debt.');
      return;
    }

    await prepareTransaction(
      `Repay for position #${selectedTokenId}`,
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareRepay({
          amount: repayAmountValue,
          recipientTokenId: BigInt(selectedTokenId),
        });
      },
      'Failed to prepare repay transaction.',
    );
  };

  const handlePrepareBurn = async () => {
    if (!selectedTokenId) {
      setTxError('Choose a position before preparing a burn transaction.');
      return;
    }

    if (!selectedPosition) {
      setTxError('The selected position could not be loaded.');
      return;
    }

    if (!burnAmountValue) {
      setTxError('Enter a valid burn amount greater than zero.');
      return;
    }

    if (burnAmountValue > selectedPosition.debt) {
      setTxError('Burn amount exceeds the selected position debt.');
      return;
    }

    await prepareTransaction(
      `Burn against position #${selectedTokenId}`,
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareBurn({
          amount: burnAmountValue,
          recipientTokenId: BigInt(selectedTokenId),
        });
      },
      'Failed to prepare burn transaction.',
    );
  };

  const handleSendPreparedTransaction = () => {
    if (!preparedTx) {
      return;
    }

    setTxError(null);

    sendTransaction({
      to: preparedTx.to,
      data: preparedTx.data,
      value: preparedTx.value,
    });
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
            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Position + Transaction Flow</h1>
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
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>V3 Position Action Builder</h2>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: '1rem',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Working Position</div>
              <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                Existing position actions use this tokenId
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
                }}
              >
                <option value="">Select a position</option>
                {positions.map((position) => (
                  <option key={position.tokenId.toString()} value={position.tokenId.toString()}>
                    #{position.tokenId.toString()} ({formatTokenAmount(position.availableCredit)} available)
                  </option>
                ))}
              </select>
              {selectedPosition ? (
                <div
                  style={{
                    marginTop: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <div style={{ opacity: 0.7 }}>Collateral</div>
                    <div style={{ fontWeight: 700 }}>{formatTokenAmount(selectedPosition.collateral)}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.7 }}>Debt</div>
                    <div style={{ fontWeight: 700 }}>{formatTokenAmount(selectedPosition.debt)}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.7 }}>Available</div>
                    <div style={{ fontWeight: 700 }}>{formatTokenAmount(selectedPosition.availableCredit)}</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.7 }}>Health</div>
                    <div style={{ fontWeight: 700 }}>{formatHealth(selectedPosition.healthFactor)}</div>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888' }}>
                  Select a position to enable withdraw, borrow, repay, and burn builders.
                </div>
              )}
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
                  border:
                    preferredAction === 'deposit'
                      ? '1px solid rgba(74,222,128,0.35)'
                      : '1px solid rgba(255,255,255,0.05)',
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
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                  Creates a new tokenId-backed position.
                </div>
                <button
                  onClick={handlePrepareDeposit}
                  disabled={isPreparing || !canPrepareDeposit}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !canPrepareDeposit ? '#444' : '#4ade80',
                    color: isPreparing || !canPrepareDeposit ? '#999' : '#04130a',
                    fontWeight: 700,
                    cursor: isPreparing || !canPrepareDeposit ? 'not-allowed' : 'pointer',
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
                  border:
                    preferredAction === 'borrow'
                      ? '1px solid rgba(96,165,250,0.35)'
                      : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Withdraw From Position</div>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
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
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                  Max withdrawable here is {selectedPosition ? formatTokenAmount(selectedPosition.collateral) : '0.0000'}.
                </div>
                <button
                  onClick={handlePrepareWithdraw}
                  disabled={isPreparing || !canPrepareWithdraw}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !canPrepareWithdraw ? '#444' : '#38bdf8',
                    color: isPreparing || !canPrepareWithdraw ? '#999' : '#07131b',
                    fontWeight: 700,
                    cursor: isPreparing || !canPrepareWithdraw ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Withdraw
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border:
                    preferredAction === 'borrow'
                      ? '1px solid rgba(96,165,250,0.35)'
                      : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Borrow From Position</div>
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
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                  Available credit is {selectedPosition ? formatTokenAmount(selectedPosition.availableCredit) : '0.0000'}.
                </div>
                <button
                  onClick={handlePrepareBorrow}
                  disabled={isPreparing || !canPrepareBorrow}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !canPrepareBorrow ? '#444' : '#60a5fa',
                    color: isPreparing || !canPrepareBorrow ? '#999' : '#041320',
                    fontWeight: 700,
                    cursor: isPreparing || !canPrepareBorrow ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Borrow
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border:
                    preferredAction === 'repay'
                      ? '1px solid rgba(251,191,36,0.35)'
                      : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Repay With Collateral</div>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={repayAmount}
                  onChange={(event) => setRepayAmount(event.target.value)}
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
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                  Current debt is {selectedPosition ? formatTokenAmount(selectedPosition.debt) : '0.0000'}.
                </div>
                <button
                  onClick={handlePrepareRepay}
                  disabled={isPreparing || !canPrepareRepay}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !canPrepareRepay ? '#444' : '#fbbf24',
                    color: isPreparing || !canPrepareRepay ? '#999' : '#1a1201',
                    fontWeight: 700,
                    cursor: isPreparing || !canPrepareRepay ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Repay
                </button>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  border:
                    preferredAction === 'burn'
                      ? '1px solid rgba(248,113,113,0.35)'
                      : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Burn Debt Tokens</div>
                <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={burnAmount}
                  onChange={(event) => setBurnAmount(event.target.value)}
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
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.75rem' }}>
                  Burn is capped by current debt: {selectedPosition ? formatTokenAmount(selectedPosition.debt) : '0.0000'}.
                </div>
                <button
                  onClick={handlePrepareBurn}
                  disabled={isPreparing || !canPrepareBurn}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    border: 'none',
                    borderRadius: '0.75rem',
                    backgroundColor: isPreparing || !canPrepareBurn ? '#444' : '#f87171',
                    color: isPreparing || !canPrepareBurn ? '#999' : '#1c0909',
                    fontWeight: 700,
                    cursor: isPreparing || !canPrepareBurn ? 'not-allowed' : 'pointer',
                  }}
                >
                  Prepare Burn
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
              <div style={{ display: 'grid', gap: '0.75rem' }}>
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

                <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
                  Submit Prepared Transaction
                </div>
                <div
                  style={{
                    backgroundColor: '#0b0f14',
                    borderRadius: '1rem',
                    padding: '1rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <button
                    onClick={handleSendPreparedTransaction}
                    disabled={!canSubmitPreparedTx || isSending || isConfirming}
                    style={{
                      width: '100%',
                      padding: '0.95rem',
                      border: 'none',
                      borderRadius: '0.75rem',
                      backgroundColor:
                        !canSubmitPreparedTx || isSending || isConfirming ? '#444' : '#fbbf24',
                      color:
                        !canSubmitPreparedTx || isSending || isConfirming ? '#999' : '#1a1201',
                      fontWeight: 700,
                      cursor:
                        !canSubmitPreparedTx || isSending || isConfirming ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSending ? 'Awaiting Wallet Confirmation...' :
                     isConfirming ? 'Submitting Transaction...' :
                     isSuccess ? 'Transaction Submitted' :
                     'Send with Connected Wallet'}
                  </button>

                  {!canSubmitPreparedTx && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888' }}>
                      External wallet mode plus contract-backed V3 config is required for signing in this preview.
                    </div>
                  )}

                  {sendError && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        backgroundColor: 'rgba(255,68,68,0.12)',
                        color: '#fca5a5',
                        fontSize: '0.85rem',
                      }}
                    >
                      {sendError.message}
                    </div>
                  )}

                  {txHash && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'grid',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ color: '#86efac', fontWeight: 700 }}>Transaction Hash</div>
                      <div style={{ wordBreak: 'break-all' }}>{txHash}</div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#fcd34d',
                          textDecoration: 'none',
                          fontWeight: 700,
                        }}
                      >
                        View on Etherscan
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

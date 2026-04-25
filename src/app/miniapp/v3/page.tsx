'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import styles from '../page.module.css';
import { getV3Adapter, useV3Positions, v3Config, ZERO_ADDRESS } from '@/lib/v3';
import type { PreparedV3Transaction, V3ProtocolState } from '@/lib/v3';
import { useWallet } from '@/lib/wallet/hooks';

type V3Action = 'deposit' | 'withdraw' | 'borrow' | 'repay' | 'burn' | 'selfLiquidate';

function getEtherscanBaseUrl(chainId: number): string {
  switch (chainId) {
    case 1: return 'https://etherscan.io';
    case 10: return 'https://optimistic.etherscan.io';
    case 42161: return 'https://arbiscan.io';
    case 11155111: return 'https://sepolia.etherscan.io';
    default: return 'https://etherscan.io';
  }
}

function formatTokenAmount(value: bigint): string {
  return Number.parseFloat(formatEther(value)).toFixed(4);
}

function formatHealth(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : 'INF';
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
  const { address, isConnected, isConnecting, walletMode } = useWallet();
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
  const [mockSubmissionId, setMockSubmissionId] = useState<string | null>(null);
  const [requestedAction, setRequestedAction] = useState<string | null>(null);
  const [protocolState, setProtocolState] = useState<V3ProtocolState | null>(null);

  const preferredAction: V3Action =
    requestedAction === 'withdraw' ||
    requestedAction === 'borrow' ||
    requestedAction === 'repay' ||
    requestedAction === 'burn' ||
    requestedAction === 'selfLiquidate'
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
    withdrawAmountValue <= selectedPosition.maxWithdrawable;
  const canPrepareSelfLiquidate =
    !!address &&
    !!selectedPosition &&
    selectedPosition.debt > 0n;
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
  const canSimulatePreparedTx = !!preparedTx && v3Config.mode === 'mock';

  const walletSummary = isConnecting
    ? 'Checking...'
    : isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Not connected';

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

  useEffect(() => {
    if (!isEnabled || !isConnected) return;
    const adapter = getV3Adapter();
    if (!adapter.isReady()) return;
    adapter.getProtocolState().then(setProtocolState).catch(() => {});
  }, [isEnabled, isConnected]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextAction = new URLSearchParams(window.location.search).get('action');
    setRequestedAction(nextAction);
  }, []);

  useEffect(() => {
    setMockSubmissionId(null);
  }, [preparedTx]);

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
    } catch (nextError) {
      setPreparedTx(null);
      setTxLabel(null);
      setTxError(nextError instanceof Error ? nextError.message : fallbackError);
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

    if (withdrawAmountValue > selectedPosition.maxWithdrawable) {
      setTxError('Withdraw amount exceeds the maximum safe withdrawable amount.');
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

  const handlePrepareSelfLiquidate = async () => {
    if (!address) {
      setTxError('Connect a wallet before preparing a transaction.');
      return;
    }

    if (!selectedTokenId || !selectedPosition) {
      setTxError('Choose a position before preparing a self-liquidation.');
      return;
    }

    if (selectedPosition.debt === 0n) {
      setTxError('This position has no debt to self-liquidate.');
      return;
    }

    await prepareTransaction(
      `Self-liquidate position #${selectedTokenId}`,
      async () => {
        const adapter = getV3Adapter();
        return adapter.prepareSelfLiquidate({
          accountId: BigInt(selectedTokenId),
          recipient: address,
        });
      },
      'Failed to prepare self-liquidation transaction.',
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

  const handleSimulatePreparedTransaction = () => {
    if (!preparedTx) {
      return;
    }

    setTxError(null);
    setMockSubmissionId(`mock-${Date.now().toString(36)}`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Alchemix V3 Preview</span>
                <span className={styles.networkBadge}>Transaction builder</span>
              </div>
              <h1 className={styles.heroTitle}>Position + Transaction Flow</h1>
              <p className={styles.heroSubtitle}>
                Prepare deposit, withdraw, borrow, repay, and burn actions using the same
                wallet-native layout as the main mini app.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Wallet</span>
              <strong>{walletSummary}</strong>
              <Link href="/miniapp" className={styles.secondaryButton}>
                Back to wallet
              </Link>
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Feature flag</span>
              <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong>
              <span className={styles.metricFoot}>`NEXT_PUBLIC_ENABLE_ALCHEMIX_V3`</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Mode</span>
              <strong>{v3Config.mode}</strong>
              <span className={styles.metricFoot}>Adapter execution mode</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Chain</span>
              <strong>{v3Config.chainId}</strong>
              <span className={styles.metricFoot}>Current target chain</span>
            </div>
          </div>
        </section>

        {!isEnabled && (
          <div className={styles.callout}>
            <strong>V3 preview is disabled.</strong>
            <span>
              Enable <code className={styles.inlineCode}>NEXT_PUBLIC_ENABLE_ALCHEMIX_V3=true</code> in
              your env to use this screen.
            </span>
          </div>
        )}

        {isEnabled && isConnecting && (
          <div className={styles.callout}>
            <strong>Checking wallet connection.</strong>
            <span>Hold on while we resolve wallet state before loading positions.</span>
          </div>
        )}

        {isEnabled && !isConnecting && !isConnected && (
          <div className={styles.callout}>
            <strong>No connected wallet.</strong>
            <span>Connect in the main mini app first, then return here for V3 transaction prep.</span>
          </div>
        )}

        {isEnabled && isConnected && (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Positions</p>
                  <h2 className={styles.panelTitle}>
                    {isLoading ? 'Loading...' : `${positions.length} position(s) available`}
                  </h2>
                </div>
                <button className={styles.iconButton} onClick={reload}>
                  Refresh
                </button>
              </div>

              {error && <div className={styles.callout}>{error}</div>}

              {!error && !isLoading && positions.length === 0 && (
                <div className={styles.callout}>No V3 positions were found for this wallet.</div>
              )}

              <div className={styles.stackCompact}>
                {positions.map((position) => (
                  <div key={position.tokenId.toString()} className={styles.listCard}>
                    <div className={styles.listTop}>
                      <strong>Position #{position.tokenId.toString()}</strong>
                      <span
                        className={
                          position.healthState === 'safe'
                            ? styles.statusChipSafe
                            : position.healthState === 'watch'
                              ? styles.statusChipWatch
                              : styles.statusChipDanger
                        }
                      >
                        {position.healthState}
                      </span>
                    </div>
                    <div className={styles.v3Metrics}>
                      <span>Collateral {formatTokenAmount(position.collateral)}</span>
                      <span>Debt {formatTokenAmount(position.debt)}</span>
                      <span>Earmarked {formatTokenAmount(position.earmarked)}</span>
                      <span>Available {formatTokenAmount(position.availableCredit)}</span>
                      <span>Max withdraw {formatTokenAmount(position.maxWithdrawable)}</span>
                      <span>Health {formatHealth(position.healthFactor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {protocolState && (protocolState.depositsPaused || protocolState.loansPaused) && (
              <div className={styles.callout}>
                <strong>⚠️ Protocol Alert</strong>
                <span>
                  {protocolState.depositsPaused && 'Deposits are currently paused by the protocol. '}
                  {protocolState.loansPaused && 'Loans/minting are currently paused by the protocol.'}
                </span>
              </div>
            )}

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Transaction prep</p>
                  <h2 className={styles.panelTitle}>V3 position action builder</h2>
                </div>
              </div>

              <div className={styles.lessonCard}>
                <span className={styles.infoLabel}>Working position</span>
                <strong>Existing position actions use this tokenId</strong>
                <label className={styles.field}>
                  <span>Token ID</span>
                  <select
                    value={selectedTokenId}
                    onChange={(event) => setSelectedTokenId(event.target.value)}
                    className={styles.input}
                  >
                    <option value="">Select a position</option>
                    {positions.map((position) => (
                      <option key={position.tokenId.toString()} value={position.tokenId.toString()}>
                        #{position.tokenId.toString()} ({formatTokenAmount(position.availableCredit)} available)
                      </option>
                    ))}
                  </select>
                </label>
                {positions.length === 1 && (
                  <p>
                    This wallet currently has one loaded position, so selector changes will only
                    appear after new positions are discovered.
                  </p>
                )}
                {selectedPosition ? (
                  <div className={styles.v3Metrics}>
                    <span>Collateral {formatTokenAmount(selectedPosition.collateral)}</span>
                    <span>Debt {formatTokenAmount(selectedPosition.debt)}</span>
                    <span>Earmarked {formatTokenAmount(selectedPosition.earmarked)}</span>
                    <span>Available {formatTokenAmount(selectedPosition.availableCredit)}</span>
                    <span>Max withdraw {formatTokenAmount(selectedPosition.maxWithdrawable)}</span>
                    <span>Health {formatHealth(selectedPosition.healthFactor)}</span>
                  </div>
                ) : (
                  <p>Select a position to enable withdraw, borrow, repay, burn, and self-liquidation actions.</p>
                )}
              </div>

              <div className={styles.v3ActionGrid}>
                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'deposit' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>New deposit</span>
                  <strong>Create a tokenId-backed position</strong>
                  <label className={styles.field}>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={depositAmount}
                      onChange={(event) => setDepositAmount(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <p>This creates a fresh position with recipientId `0`.</p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareDeposit}
                    disabled={isPreparing || !canPrepareDeposit}
                  >
                    Prepare deposit
                  </button>
                </div>

                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'withdraw' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>Withdraw</span>
                  <strong>Withdraw collateral from position</strong>
                  <label className={styles.field}>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(event) => setWithdrawAmount(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <p>
                    Max withdrawable: {selectedPosition ? formatTokenAmount(selectedPosition.maxWithdrawable) : '0.0000'}
                  </p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareWithdraw}
                    disabled={isPreparing || !canPrepareWithdraw}
                  >
                    Prepare withdraw
                  </button>
                </div>

                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'borrow' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>Borrow</span>
                  <strong>Mint against available credit</strong>
                  <label className={styles.field}>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={borrowAmount}
                      onChange={(event) => setBorrowAmount(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <p>
                    Available credit:{' '}
                    {selectedPosition ? formatTokenAmount(selectedPosition.availableCredit) : '0.0000'}
                  </p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareBorrow}
                    disabled={isPreparing || !canPrepareBorrow}
                  >
                    Prepare borrow
                  </button>
                </div>

                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'repay' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>Repay</span>
                  <strong>Repay debt with collateral</strong>
                  <label className={styles.field}>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={repayAmount}
                      onChange={(event) => setRepayAmount(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <p>Current debt: {selectedPosition ? formatTokenAmount(selectedPosition.debt) : '0.0000'}</p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareRepay}
                    disabled={isPreparing || !canPrepareRepay}
                  >
                    Prepare repay
                  </button>
                </div>

                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'burn' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>Burn debt tokens</span>
                  <strong>Burn against selected position</strong>
                  <label className={styles.field}>
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={burnAmount}
                      onChange={(event) => setBurnAmount(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <p>Max burn: {selectedPosition ? formatTokenAmount(selectedPosition.debt) : '0.0000'}</p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareBurn}
                    disabled={isPreparing || !canPrepareBurn}
                  >
                    Prepare burn
                  </button>
                </div>

                <div
                  className={`${styles.lessonCard} ${styles.v3ActionCard} ${
                    preferredAction === 'selfLiquidate' ? styles.v3ActionCardActive : ''
                  }`}
                >
                  <span className={styles.infoLabel}>Self-liquidate</span>
                  <strong>Close debt using your own collateral</strong>
                  <p>
                    Uses your collateral to fully repay debt. Only available for healthy (overcollateralized) positions.
                    Remaining collateral is sent to your wallet.
                  </p>
                  <p>Position debt: {selectedPosition ? formatTokenAmount(selectedPosition.debt) : '0.0000'}</p>
                  <button
                    className={styles.primaryButton}
                    onClick={handlePrepareSelfLiquidate}
                    disabled={isPreparing || !canPrepareSelfLiquidate}
                  >
                    Prepare self-liquidation
                  </button>
                </div>
              </div>

              {txError && <div className={styles.callout}>{txError}</div>}

              {preparedTx && (
                <div className={styles.stackCompact}>
                  <div className={styles.v3TxCard}>
                    <span className={styles.infoLabel}>{txLabel ?? 'Prepared transaction'}</span>
                    <div className={styles.v3Kv}>
                      <span>
                        Chain <strong>{preparedTx.chainId}</strong>
                      </span>
                      <span className={styles.v3Mono}>To {preparedTx.to}</span>
                      <span className={styles.v3Mono}>Value {preparedTx.value.toString()}</span>
                      <span className={styles.v3Mono}>Data {preparedTx.data}</span>
                    </div>
                  </div>

                  <div className={styles.v3TxCard}>
                    <span className={styles.infoLabel}>Submit prepared transaction</span>
                    {canSimulatePreparedTx ? (
                      <button
                        className={styles.secondaryButton}
                        onClick={handleSimulatePreparedTransaction}
                        disabled={!!mockSubmissionId}
                      >
                        {mockSubmissionId ? 'Mock submission complete' : 'Simulate submit in mock mode'}
                      </button>
                    ) : (
                      <button
                        className={styles.primaryButton}
                        onClick={handleSendPreparedTransaction}
                        disabled={!canSubmitPreparedTx || isSending || isConfirming}
                      >
                        {isSending
                          ? 'Awaiting wallet confirmation...'
                          : isConfirming
                            ? 'Submitting transaction...'
                            : isSuccess
                              ? 'Transaction submitted'
                              : 'Send with connected wallet'}
                      </button>
                    )}

                    {canSimulatePreparedTx && (
                      <p>
                        Mock mode does not send real transactions. This simulates the final step so
                        you can validate UI flow.
                      </p>
                    )}

                    {!canSimulatePreparedTx && !canSubmitPreparedTx && (
                      <p>
                        External wallet mode plus contract-backed V3 config is required for signing
                        in this preview.
                      </p>
                    )}

                    {sendError && <div className={styles.callout}>{sendError.message}</div>}

                    {txHash && (
                      <div className={styles.v3Kv}>
                        <span className={styles.infoLabel}>Transaction hash</span>
                        <span className={styles.v3Mono}>{txHash}</span>
                        <a
                          href={`${getEtherscanBaseUrl(v3Config.chainId)}/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.textLink}
                        >
                          View on Etherscan
                        </a>
                      </div>
                    )}

                    {mockSubmissionId && (
                      <div className={styles.v3Kv}>
                        <span className={styles.infoLabel}>Mock submission ID</span>
                        <span className={styles.v3Mono}>{mockSubmissionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

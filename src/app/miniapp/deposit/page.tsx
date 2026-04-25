'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatEther, parseEther, type Address } from 'viem';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import styles from '../page.module.css';
import { useWallet } from '@/lib/wallet/hooks';
import { getAlchemixClient } from '@/lib/contracts/alchemix';
import type { VaultType } from '@/types';

function formatTokenAmount(value: string): string {
  try {
    return Number.parseFloat(formatEther(BigInt(value))).toFixed(4);
  } catch {
    return '0.0000';
  }
}

export default function DepositPage() {
  const { address, isConnected, isConnecting } = useWallet();
  const { sendTransaction, data: txHash, isPending, error: sendError } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [vaultType, setVaultType] = useState<VaultType>('alUSD');
  const [amount, setAmount] = useState('');
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setAmount('');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  const parsedAmount = (() => {
    const trimmed = amount.trim();

    if (!trimmed) {
      return null;
    }

    try {
      const value = parseEther(trimmed);
      return value > 0n ? value : null;
    } catch {
      return null;
    }
  })();

  const canDeposit = isConnected && !!address && !!parsedAmount && !isPreparing && !isPending && !isConfirming;

  const handleDeposit = async () => {
    if (!address || !parsedAmount) {
      return;
    }

    setIsPreparing(true);
    setPrepareError(null);

    try {
      const client = getAlchemixClient(vaultType);
      const tx = await client.prepareDeposit(vaultType, parsedAmount, address as Address);

      sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value,
      });
    } catch (nextError) {
      setPrepareError(nextError instanceof Error ? nextError.message : 'Failed to prepare deposit.');
    } finally {
      setIsPreparing(false);
    }
  };

  const txStatus = isPending
    ? 'Waiting for wallet approval...'
    : isConfirming
      ? 'Confirming transaction...'
      : isSuccess
        ? 'Deposit confirmed!'
        : sendError
          ? sendError.message
          : null;

  const walletLabel = isConnecting
    ? 'Checking...'
    : isConnected && address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : 'Not connected';

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroRow}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.brandBadge}>Alchemix V2</span>
                <span className={styles.networkBadge}>Deposit</span>
              </div>
              <h1 className={styles.heroTitle}>Deposit Collateral</h1>
              <p className={styles.heroSubtitle}>
                Deposit into an Alchemix V2 vault. Your collateral earns yield that automatically
                repays your loans over time.
              </p>
            </div>
            <div className={styles.heroWallet}>
              <span className={styles.walletLabel}>Wallet</span>
              <strong>{walletLabel}</strong>
              <Link href="/miniapp" className={styles.secondaryButton}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>

        {!isConnected || !address ? (
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Wallet required</p>
                <h2 className={styles.panelTitle}>Connect your wallet to deposit</h2>
              </div>
            </div>
            <div className={styles.callout}>
              <strong>No wallet connected</strong>
              <span>
                Go back to the main dashboard and connect a wallet first, then return here to
                deposit into an Alchemix vault.
              </span>
            </div>
          </section>
        ) : (
          <section className={styles.stack}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Vault selection</p>
                  <h2 className={styles.panelTitle}>Choose a vault type</h2>
                </div>
              </div>

              <div className={styles.toggleRow}>
                {(['alUSD', 'alETH'] as VaultType[]).map((type) => (
                  <button
                    key={type}
                    className={type === vaultType ? styles.segmentActive : styles.segment}
                    onClick={() => setVaultType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>alUSD vault</span>
                  <strong>Stablecoin deposits</strong>
                  <p>
                    Deposit stablecoins (DAI, USDC, USDT) into the alUSD vault. Yield earns against
                    your alUSD debt.
                  </p>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>alETH vault</span>
                  <strong>ETH deposits</strong>
                  <p>
                    Deposit ETH into the alETH vault. Yield accrues in ETH and repays your alETH
                    debt automatically.
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>Deposit to {vaultType}</p>
                  <h2 className={styles.panelTitle}>Enter deposit amount</h2>
                </div>
              </div>

              <div className={styles.formCard}>
                <label className={styles.field}>
                  <span>Amount ({vaultType === 'alETH' ? 'ETH' : 'stablecoin units'})</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={vaultType === 'alETH' ? '1.0' : '100'}
                  />
                </label>

                {parsedAmount && (
                  <div className={styles.callout}>
                    <strong>Deposit preview</strong>
                    <span>
                      {formatTokenAmount(parsedAmount.toString())}{' '}
                      {vaultType === 'alETH' ? 'ETH' : 'stablecoin'} → {vaultType} vault
                    </span>
                  </div>
                )}

                <button
                  className={styles.primaryButton}
                  onClick={handleDeposit}
                  disabled={!canDeposit}
                >
                  {isPreparing
                    ? 'Preparing...'
                    : isPending
                      ? 'Awaiting wallet...'
                      : isConfirming
                        ? 'Confirming...'
                        : `Deposit into ${vaultType}`}
                </button>

                {prepareError && (
                  <div className={styles.callout}>
                    <strong>Preparation error</strong>
                    <span>{prepareError}</span>
                  </div>
                )}

                {txStatus && (
                  <div className={styles.callout}>
                    <strong>Transaction status</strong>
                    <span>{txStatus}</span>
                  </div>
                )}

                {txHash && (
                  <div className={styles.callout}>
                    <strong>Transaction hash</strong>
                    <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {txHash}
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.textLink}
                    >
                      View on Etherscan
                    </a>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.eyebrow}>How it works</p>
                  <h2 className={styles.panelTitle}>Self-repaying loans</h2>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>Step 1</span>
                  <strong>Deposit collateral</strong>
                  <p>Your deposit is routed to yield-generating strategies (e.g., Yearn vaults).</p>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>Step 2</span>
                  <strong>Borrow up to 50%</strong>
                  <p>
                    Mint synthetic assets (alUSD or alETH) against your deposit — up to 50% of
                    collateral value.
                  </p>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>Step 3</span>
                  <strong>Yield repays debt</strong>
                  <p>
                    The yield earned by your collateral is automatically applied to reduce your debt
                    over time.
                  </p>
                </div>
                <div className={styles.infoTile}>
                  <span className={styles.infoLabel}>Step 4</span>
                  <strong>Withdraw freely</strong>
                  <p>Once debt reaches zero, withdraw your full collateral — no liquidation risk.</p>
                </div>
              </div>
            </section>
          </section>
        )}
      </div>
    </main>
  );
}

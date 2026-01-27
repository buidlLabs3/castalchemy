/**
 * Client component for deposit page
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/hooks';
import { depositToAlchemix } from '@/lib/contracts/transactions';
import { WalletButton } from '@/components/WalletButton';
import type { Address } from 'viem';

export function DepositClient() {
  const [vault, setVault] = useState<'alUSD' | 'alETH' | null>(null);
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { address, isConnected } = useWallet();

  const handleDeposit = async () => {
    if (!address || !vault || !amount) return;

    setIsDepositing(true);
    setError(null);
    setTxHash(null);

    try {
      const hash = await depositToAlchemix(vault, amount, address as Address);
      setTxHash(hash);
      
      setTimeout(() => {
        router.push('/miniapp/positions');
      }, 3000);
    } catch (err) {
      console.error('Deposit failed:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <WalletButton />
      </div>

      {!isConnected && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#2a2a2a',
          borderRadius: '0.75rem',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <p style={{ margin: 0, color: '#888' }}>
            Connect your wallet to deposit to Alchemix vaults
          </p>
        </div>
      )}

      {isConnected && !vault && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          <button
            onClick={() => setVault('alUSD')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#4ade80',
              color: '#000',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            alUSD Vault (Stablecoins)
          </button>
          <button
            onClick={() => setVault('alETH')}
            style={{
              padding: '1.5rem',
              backgroundColor: '#60a5fa',
              color: '#000',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            alETH Vault (ETH)
          </button>
        </div>
      )}

      {isConnected && vault && !txHash && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              {vault} Vault
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {vault === 'alUSD' 
                ? 'Deposit DAI, USDC, or USDT to borrow alUSD' 
                : 'Deposit ETH to borrow alETH'}
            </p>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isDepositing}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '2px solid #4a4a4a',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginBottom: '1rem',
              }}
            />
            <button
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || isDepositing}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: parseFloat(amount) > 0 && !isDepositing ? '#4ade80' : '#444',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: parseFloat(amount) > 0 && !isDepositing ? 'pointer' : 'not-allowed',
              }}
            >
              {isDepositing ? 'Depositing...' : `Deposit ${amount || '0'} ${vault === 'alUSD' ? 'USD' : 'ETH'}`}
            </button>
            {error && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#ff4444',
                borderRadius: '0.5rem',
                color: '#fff',
              }}>
                ❌ {error}
              </div>
            )}
          </div>
          <button
            onClick={() => setVault(null)}
            disabled={isDepositing}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: isDepositing ? 'not-allowed' : 'pointer',
            }}
          >
            Choose Different Vault
          </button>
        </div>
      )}

      {txHash && (
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: '#2a2a2a',
          borderRadius: '0.75rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4ade80' }}>
            Deposit Successful!
          </h2>
          <p style={{ color: '#888', marginBottom: '1rem', wordBreak: 'break-all' }}>
            Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </p>
          <a
            href={`https://etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4ade80',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '0.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            View on Etherscan
          </a>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Redirecting to positions...
          </p>
        </div>
      )}

      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#2a2a2a',
        borderRadius: '0.5rem',
        fontSize: '0.85rem',
        color: '#888',
        maxWidth: '400px',
      }}>
        <p style={{ margin: 0, marginBottom: '0.5rem' }}>
          ⚠️ <strong>Real Transactions:</strong>
        </p>
        <p style={{ margin: 0 }}>
          This will execute actual deposits to Alchemix V2 contracts on Ethereum mainnet. Make sure you have sufficient ETH for gas fees.
        </p>
      </div>
    </>
  );
}


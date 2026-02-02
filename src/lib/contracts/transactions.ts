/**
 * Transaction helpers for Alchemix contracts
 */
import { parseUnits, type Address, encodeFunctionData } from 'viem';
import { getFarcasterProvider } from '../wallet/hooks';
import { ALCHEMIX_V2_VAULTS } from '../config/networks';

const VAULT_ABI = [
  {
    name: 'depositUnderlying',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yieldToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'minimumAmountOut', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'yieldToken', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'accounts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'debt', type: 'int256' }],
  },
  {
    name: 'totalValue',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Deposit to Alchemix vault
 */
export async function depositToAlchemix(
  vaultType: 'alUSD' | 'alETH',
  amount: string,
  userAddress: Address,
  yieldToken?: Address
): Promise<string> {
  const vault = ALCHEMIX_V2_VAULTS[vaultType];
  if (!vault) throw new Error('Vault not found');

  // Default yield tokens
  const defaultYieldToken = 
    vaultType === 'alUSD'
      ? '0x028171bCA77440897B824Ca71D1c56caC55b68A3' as Address // aDAI
      : '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address; // stETH

  const yieldTokenAddress = yieldToken || defaultYieldToken;
  const amountWei = parseUnits(amount, 18);
  const provider = await getFarcasterProvider();

  // Step 1: Check allowance and approve if needed
  const allowanceData = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [userAddress, vault.address as Address],
  });

  const allowanceResult = await provider.request({
    method: 'eth_call',
    params: [
      {
        to: yieldTokenAddress,
        data: allowanceData,
      },
      'latest',
    ],
  });

  const allowance = BigInt(allowanceResult as string);

  if (allowance < amountWei) {
    // Need to approve first
    const approveData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vault.address as Address, amountWei],
    });

    const approveTx = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: userAddress,
          to: yieldTokenAddress,
          data: approveData,
        },
      ],
    });

    console.log('Approval tx:', approveTx);
    // In production, wait for approval confirmation
  }

  // Step 2: Deposit
  const depositData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'depositUnderlying',
    args: [yieldTokenAddress, amountWei, userAddress, 0n],
  });

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: userAddress,
        to: vault.address as Address,
        data: depositData,
      },
    ],
  });

  return txHash as string;
}

/**
 * Borrow (mint) from Alchemix vault
 */
export async function borrowFromAlchemix(
  vaultType: 'alUSD' | 'alETH',
  amount: string,
  userAddress: Address,
  yieldToken?: Address
): Promise<string> {
  const vault = ALCHEMIX_V2_VAULTS[vaultType];
  if (!vault) throw new Error('Vault not found');

  const defaultYieldToken = 
    vaultType === 'alUSD'
      ? '0x028171bCA77440897B824Ca71D1c56caC55b68A3' as Address // aDAI
      : '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as Address; // stETH

  const yieldTokenAddress = yieldToken || defaultYieldToken;
  const amountWei = parseUnits(amount, 18);
  const provider = await getFarcasterProvider();

  const borrowData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'mint',
    args: [yieldTokenAddress, amountWei, userAddress],
  });

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: userAddress,
        to: vault.address as Address,
        data: borrowData,
      },
    ],
  });

  return txHash as string;
}

/**
 * Get user's position in a vault
 */
export async function getPosition(
  vaultType: 'alUSD' | 'alETH',
  userAddress: Address
): Promise<{
  deposited: string;
  borrowed: string;
  healthFactor: string;
}> {
  const vault = ALCHEMIX_V2_VAULTS[vaultType];
  if (!vault) throw new Error('Vault not found');

  const provider = await getFarcasterProvider();

  // Get total value (collateral)
  const totalValueData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'totalValue',
    args: [userAddress],
  });

  const totalValueResult = await provider.request({
    method: 'eth_call',
    params: [
      {
        to: vault.address as Address,
        data: totalValueData,
      },
      'latest',
    ],
  });

  const deposited = BigInt(totalValueResult as string);

  // Get debt
  const accountsData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: 'accounts',
    args: [userAddress],
  });

  const accountsResult = await provider.request({
    method: 'eth_call',
    params: [
      {
        to: vault.address as Address,
        data: accountsData,
      },
      'latest',
    ],
  });

  const debt = BigInt(accountsResult as string);
  const borrowed = debt > 0n ? debt : 0n;

  // Calculate health factor (simplified: collateral / debt)
  let healthFactor = 'Healthy';
  if (borrowed > 0n && deposited > 0n) {
    const ratio = (deposited * 100n) / borrowed;
    healthFactor = ratio >= 200n ? 'Healthy' : ratio >= 150n ? 'Warning' : 'Critical';
  }

  return {
    deposited: (Number(deposited) / 1e18).toFixed(4),
    borrowed: (Number(borrowed) / 1e18).toFixed(4),
    healthFactor,
  };
}


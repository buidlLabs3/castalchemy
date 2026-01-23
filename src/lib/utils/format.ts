/**
 * Formatting utilities for display
 */

/**
 * Format amount from wei to readable format
 */
export function formatAmount(amount: string | bigint, decimals: number = 18): string {
  const num = typeof amount === 'string' ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** decimals);
  const whole = num / divisor;
  const remainder = num % divisor;
  
  if (whole === 0n && remainder === 0n) {
    return '0';
  }
  
  if (whole > 0n) {
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    if (trimmed) {
      return `${whole}.${trimmed}`;
    }
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  return `0.${remainderStr.replace(/0+$/, '')}`;
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: string | bigint, symbol: string = 'ETH', decimals: number = 18): string {
  return `${formatAmount(amount, decimals)} ${symbol}`;
}

/**
 * Format health factor for display
 */
export function formatHealthFactor(healthFactor: number): string {
  if (healthFactor >= 2.0) {
    return `${healthFactor.toFixed(2)} (Safe)`;
  }
  if (healthFactor >= 1.5) {
    return `${healthFactor.toFixed(2)} (Good)`;
  }
  if (healthFactor >= 1.1) {
    return `${healthFactor.toFixed(2)} (Warning)`;
  }
  return `${healthFactor.toFixed(2)} (Danger)`;
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) {
    return address;
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}


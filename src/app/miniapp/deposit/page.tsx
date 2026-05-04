/**
 * Deposit shortcut — all deposits go through the V3 builder.
 */
import { redirect } from 'next/navigation';

export default function DepositPage() {
  redirect('/miniapp/v3?action=deposit');
}

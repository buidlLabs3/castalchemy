/**
 * Legacy V2 deposit page — redirects to V3 builder.
 * V2 is no longer supported; all deposits go through V3.
 */
import { redirect } from 'next/navigation';

export default function DepositPage() {
  redirect('/miniapp/v3?action=deposit');
}

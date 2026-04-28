/**
 * Legacy V2 positions page — redirects to V3 builder.
 * V2 is no longer supported; all position management goes through V3.
 */
import { redirect } from 'next/navigation';

export default function PositionsPage() {
  redirect('/miniapp/v3');
}

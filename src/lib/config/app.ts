const DEFAULT_APP_URL = 'https://castalchemy.vercel.app';

export function getPublicAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['frog'],
  // Enable JSX in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination:
          'https://api.farcaster.xyz/miniapps/hosted-manifest/019dff54-2a5b-994c-119d-9f8908bb9263',
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    };
    return config;
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Identifies this deployment, so open tabs can tell when a newer one is live.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now()),
  },
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'placehold.co' }],
  },
  // Enable SWC minification so modern dependencies like midtrans-client build correctly
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Suppress Supabase realtime warnings
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ];
    return config;
  },
};

module.exports = nextConfig;

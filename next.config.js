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
  // The income zakat guide was rewritten as the zakat maal guide.
  async redirects() {
    return [
      {
        source: '/panduan/cara-menghitung-zakat-penghasilan',
        destination: '/panduan/cara-menghitung-zakat-maal',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Suppress Supabase realtime warnings
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
    ];
    return config;
  },
};

module.exports = nextConfig;

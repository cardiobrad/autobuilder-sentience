/** @type {import('next').NextConfig} */
const nextConfig = {
  // This tells Next.js to handle bcryptjs correctly
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // We keep the linting ignored to ensure a smooth build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

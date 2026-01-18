/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
